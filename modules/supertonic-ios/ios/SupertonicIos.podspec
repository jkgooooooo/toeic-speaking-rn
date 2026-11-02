Pod::Spec.new do |s|
  s.name = 'SupertonicIos'
  s.version = '0.1.0'
  s.summary = 'On-device Supertonic synthesis for speaking'
  s.description = 'Expo module for local Supertonic voice synthesis.'
  s.author = 'speaking'
  s.homepage = 'https://github.com/supertone-oss-archive/supertonic'
  s.license = { :type => 'MIT' }
  s.source = { :path => '.' }
  s.platforms = { :ios => '16.4' }
  s.swift_version = '5.9'
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.dependency 'onnxruntime-objc', '~> 1.18.0'
  s.source_files = '**/*.{h,m,mm,swift}'
end
