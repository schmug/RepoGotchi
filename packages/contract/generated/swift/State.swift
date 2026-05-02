// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let state = try State(json)

//
// Hashable or Equatable:
// The compiler will not be able to synthesize the implementation of Hashable or Equatable
// for types that require the use of JSONAny, nor will the implementation of Hashable be
// synthesized for types that have collections (such as arrays or dictionaries).

import Foundation

/// Live mood and score snapshot for a pet, recomputed from repo signals.
// MARK: - State
public struct State: Codable, Equatable {
    public let computedAt: Date
    public let evolutionStage: EvolutionStage
    public let level: Int
    public let mood: Mood
    public let petID: String
    public let schemaVersion: Int
    public let scores: Scores
    /// Raw observations from the source. All optional; surfaces report what they can see.
    public let signals: Signals
    public let source: Source
    /// Short human-readable status, e.g. 'Drowning in lint errors'.
    public let statusHeadline: String

    public enum CodingKeys: String, CodingKey {
        case computedAt, evolutionStage, level, mood
        case petID = "petId"
        case schemaVersion, scores, signals, source, statusHeadline
    }

    public init(computedAt: Date, evolutionStage: EvolutionStage, level: Int, mood: Mood, petID: String, schemaVersion: Int, scores: Scores, signals: Signals, source: Source, statusHeadline: String) {
        self.computedAt = computedAt
        self.evolutionStage = evolutionStage
        self.level = level
        self.mood = mood
        self.petID = petID
        self.schemaVersion = schemaVersion
        self.scores = scores
        self.signals = signals
        self.source = source
        self.statusHeadline = statusHeadline
    }
}

// MARK: State convenience initializers and mutators

public extension State {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(State.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        computedAt: Date? = nil,
        evolutionStage: EvolutionStage? = nil,
        level: Int? = nil,
        mood: Mood? = nil,
        petID: String? = nil,
        schemaVersion: Int? = nil,
        scores: Scores? = nil,
        signals: Signals? = nil,
        source: Source? = nil,
        statusHeadline: String? = nil
    ) -> State {
        return State(
            computedAt: computedAt ?? self.computedAt,
            evolutionStage: evolutionStage ?? self.evolutionStage,
            level: level ?? self.level,
            mood: mood ?? self.mood,
            petID: petID ?? self.petID,
            schemaVersion: schemaVersion ?? self.schemaVersion,
            scores: scores ?? self.scores,
            signals: signals ?? self.signals,
            source: source ?? self.source,
            statusHeadline: statusHeadline ?? self.statusHeadline
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum EvolutionStage: String, Codable, Equatable {
    case adult = "adult"
    case ancient = "ancient"
    case egg = "egg"
    case elder = "elder"
    case hatchling = "hatchling"
    case juvenile = "juvenile"
}

public enum Mood: String, Codable, Equatable {
    case angry = "angry"
    case excited = "excited"
    case ghost = "ghost"
    case happy = "happy"
    case sad = "sad"
    case sick = "sick"
    case sleepy = "sleepy"
}

//
// Hashable or Equatable:
// The compiler will not be able to synthesize the implementation of Hashable or Equatable
// for types that require the use of JSONAny, nor will the implementation of Hashable be
// synthesized for types that have collections (such as arrays or dictionaries).

// MARK: - Scores
public struct Scores: Codable, Equatable {
    public let cleanliness, energy, happiness, health: Int

    public init(cleanliness: Int, energy: Int, happiness: Int, health: Int) {
        self.cleanliness = cleanliness
        self.energy = energy
        self.happiness = happiness
        self.health = health
    }
}

// MARK: Scores convenience initializers and mutators

public extension Scores {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Scores.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        cleanliness: Int? = nil,
        energy: Int? = nil,
        happiness: Int? = nil,
        health: Int? = nil
    ) -> Scores {
        return Scores(
            cleanliness: cleanliness ?? self.cleanliness,
            energy: energy ?? self.energy,
            happiness: happiness ?? self.happiness,
            health: health ?? self.health
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

//
// Hashable or Equatable:
// The compiler will not be able to synthesize the implementation of Hashable or Equatable
// for types that require the use of JSONAny, nor will the implementation of Hashable be
// synthesized for types that have collections (such as arrays or dictionaries).

/// Raw observations from the source. All optional; surfaces report what they can see.
// MARK: - Signals
public struct Signals: Codable, Equatable {
    public let ciStatus: CiStatus?
    public let contributors: Int?
    public let hasUncommittedChanges, isArchived: Bool?
    public let lastCommitDaysAgo: Double?
    public let openIssues, openPullRequests, stars: Int?
    public let testStatus: TestStatus?

    public init(ciStatus: CiStatus?, contributors: Int?, hasUncommittedChanges: Bool?, isArchived: Bool?, lastCommitDaysAgo: Double?, openIssues: Int?, openPullRequests: Int?, stars: Int?, testStatus: TestStatus?) {
        self.ciStatus = ciStatus
        self.contributors = contributors
        self.hasUncommittedChanges = hasUncommittedChanges
        self.isArchived = isArchived
        self.lastCommitDaysAgo = lastCommitDaysAgo
        self.openIssues = openIssues
        self.openPullRequests = openPullRequests
        self.stars = stars
        self.testStatus = testStatus
    }
}

// MARK: Signals convenience initializers and mutators

public extension Signals {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Signals.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        ciStatus: CiStatus?? = nil,
        contributors: Int?? = nil,
        hasUncommittedChanges: Bool?? = nil,
        isArchived: Bool?? = nil,
        lastCommitDaysAgo: Double?? = nil,
        openIssues: Int?? = nil,
        openPullRequests: Int?? = nil,
        stars: Int?? = nil,
        testStatus: TestStatus?? = nil
    ) -> Signals {
        return Signals(
            ciStatus: ciStatus ?? self.ciStatus,
            contributors: contributors ?? self.contributors,
            hasUncommittedChanges: hasUncommittedChanges ?? self.hasUncommittedChanges,
            isArchived: isArchived ?? self.isArchived,
            lastCommitDaysAgo: lastCommitDaysAgo ?? self.lastCommitDaysAgo,
            openIssues: openIssues ?? self.openIssues,
            openPullRequests: openPullRequests ?? self.openPullRequests,
            stars: stars ?? self.stars,
            testStatus: testStatus ?? self.testStatus
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum CiStatus: String, Codable, Equatable {
    case failing = "failing"
    case passing = "passing"
    case pending = "pending"
    case unknown = "unknown"
}

public enum TestStatus: String, Codable, Equatable {
    case failing = "failing"
    case passing = "passing"
    case unknown = "unknown"
}

public enum Source: String, Codable, Equatable {
    case action = "action"
    case cli = "cli"
    case manual = "manual"
    case worker = "worker"
}

// MARK: - Helper functions for creating encoders and decoders

func newJSONDecoder() -> JSONDecoder {
    let decoder = JSONDecoder()
    if #available(iOS 10.0, OSX 10.12, tvOS 10.0, watchOS 3.0, *) {
        decoder.dateDecodingStrategy = .iso8601
    }
    return decoder
}

func newJSONEncoder() -> JSONEncoder {
    let encoder = JSONEncoder()
    if #available(iOS 10.0, OSX 10.12, tvOS 10.0, watchOS 3.0, *) {
        encoder.dateEncodingStrategy = .iso8601
    }
    return encoder
}
