// Hand-written extensions to declare the generated, all-value-type
// Codable structs as Sendable. Generated.swift is rewritten on every
// codegen run, so we add the conformances out-of-band here.

import Foundation

extension Pet: @unchecked Sendable {}
extension Palette: @unchecked Sendable {}
extension Repo: @unchecked Sendable {}
extension Host: @unchecked Sendable {}

extension State: @unchecked Sendable {}
extension Mood: @unchecked Sendable {}
extension EvolutionStage: @unchecked Sendable {}
extension Source: @unchecked Sendable {}
extension CiStatus: @unchecked Sendable {}
extension TestStatus: @unchecked Sendable {}
extension Scores: @unchecked Sendable {}
extension Signals: @unchecked Sendable {}
