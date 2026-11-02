import ExpoModulesCore
import Foundation
import CryptoKit
import onnxruntime_objc

public final class SupertonicModule: Module {
  private let revision = "aafc6e32416a594460b32413efc49d7fe4ce6d46"
  private let files: [(String, String)] = [
    ("onnx/duration_predictor.onnx", "c3eb91414d5ff8a7a239b7fe9e34e7e2bf8a8140d8375ffb14718b1c639325db"),
    ("onnx/text_encoder.onnx", "c7befd5ea8c3119769e8a6c1486c4edc6a3bc8365c67621c881bbb774b9902ff"),
    ("onnx/tts.json", "42078d3aef1cd43ab43021f3c54f47d2d75ceb4e75f627f118890128b06a0d09"),
    ("onnx/unicode_indexer.json", "9bf7346e43883a81f8645c81224f786d43c5b57f3641f6e7671a7d6c493cb24f"),
    ("onnx/vector_estimator.onnx", "883ac868ea0275ef0e991524dc64f16b3c0376efd7c320af6b53f5b780d7c61c"),
    ("onnx/vocoder.onnx", "085de76dd8e8d5836d6ca66826601f615939218f90e519f70ee8a36ed2a4c4ba"),
    ("voice_styles/F1.json", "bbdec6ee00231c2c742ad05483df5334cab3b52fda3ba38e6a07059c4563dbc2"),
    ("voice_styles/M1.json", "e35604687f5d23694b8e91593a93eec0e4eca6c0b02bb8ed69139ab2ea6b0a5b")
  ]
  private var environment: ORTEnv?
  private var engine: TextToSpeech?
  private let synthQueue = DispatchQueue(label: "speaking.supertonic.synthesis")

  private var root: URL {
    FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("Supertonic3-" + revision, isDirectory: true)
  }
  private func hash(_ url: URL) throws -> String {
    let handle = try FileHandle(forReadingFrom: url)
    defer { try? handle.close() }
    var digest = SHA256()
    while true {
      let data = try handle.read(upToCount: 1024 * 1024) ?? Data()
      if data.isEmpty { break }
      digest.update(data: data)
    }
    return digest.finalize().map { String(format: "%02x", $0) }.joined()
  }
  private func isValid(_ file: String, _ expected: String) -> Bool {
    (try? hash(root.appendingPathComponent(file))) == expected
  }

  public func definition() -> ModuleDefinition {
    Name("SpeakingSupertonic")
    Events("onModelProgress")

    AsyncFunction("prepare") { () async throws -> Void in
      for (index, item) in self.files.enumerated() {
        if self.isValid(item.0, item.1) { continue }
        self.sendEvent("onModelProgress", ["completed": index, "total": self.files.count])
        let url = URL(string: "https://huggingface.co/supertone-oss-archive/supertonic-3/resolve/\(self.revision)/\(item.0)")!
        let (temporary, response) = try await URLSession.shared.download(from: url)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode), try self.hash(temporary) == item.1 else {
          throw NSError(domain: "SpeakingSupertonic", code: 1, userInfo: [NSLocalizedDescriptionKey: "음성 모델 파일을 확인하지 못했어요. 다시 시도해주세요."])
        }
        let target = self.root.appendingPathComponent(item.0)
        try FileManager.default.createDirectory(at: target.deletingLastPathComponent(), withIntermediateDirectories: true)
        if FileManager.default.fileExists(atPath: target.path) { try FileManager.default.removeItem(at: target) }
        try FileManager.default.moveItem(at: temporary, to: target)
      }
      self.sendEvent("onModelProgress", ["completed": self.files.count, "total": self.files.count])
    }

    AsyncFunction("synthesize") { (text: String, voice: String, promise: Promise) in
      self.synthQueue.async {
        do {
          guard ["F1", "M1"].contains(voice), !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw NSError(domain: "SpeakingSupertonic", code: 2, userInfo: [NSLocalizedDescriptionKey: "음성과 문장을 확인해주세요."])
          }
          if self.engine == nil {
            let environment = try ORTEnv(loggingLevel: .warning)
            self.engine = try loadTextToSpeech(self.root.appendingPathComponent("onnx").path, false, environment)
            self.environment = environment
          }
          guard let engine = self.engine else { throw NSError(domain: "SpeakingSupertonic", code: 3) }
          let style = try loadVoiceStyle([self.root.appendingPathComponent("voice_styles/\(voice).json").path], verbose: false)
          let (samples, duration) = try engine.call(text, "en", style, 8, speed: 1.0)
          let count = min(Int(Float(engine.sampleRate) * duration), samples.count)
          let output = FileManager.default.temporaryDirectory.appendingPathComponent("speaking-tts-\(UUID().uuidString).wav")
          try writeWavFile(output.path, Array(samples.prefix(count)), engine.sampleRate)
          promise.resolve(output.absoluteString)
        } catch { promise.reject("SYNTHESIS_FAILED", error.localizedDescription) }
      }
    }
  }
}
