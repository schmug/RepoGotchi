// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let pet = try Pet(json)

//
// Hashable or Equatable:
// The compiler will not be able to synthesize the implementation of Hashable or Equatable
// for types that require the use of JSONAny, nor will the implementation of Hashable be
// synthesized for types that have collections (such as arrays or dictionaries).

import Foundation

/// Canonical identity of a RepoGotchi pet. Stable for the pet's lifetime; live state lives
/// in state.json.
// MARK: - Pet
public struct Pet: Codable, Equatable {
    public let bornAt: Date
    /// Stable pet identifier. Convention: sha256(host:owner/name)[:12].
    public let id: String
    /// Display name shown in UIs.
    public let name: String
    public let palette: Palette
    /// Free-form personality description.
    public let personality: String
    public let repo: Repo
    public let schemaVersion: Int
    /// Renderer-recognised species slug. Renderers fall back to 'blob' for unknown values.
    public let species: String
    /// Stable trait slugs that drive accessory selection in the SVG renderer.
    public let traits: [String]
    /// Optional prompt fragment for premium image-generation tier.
    public let visualPrompt: String?

    public init(bornAt: Date, id: String, name: String, palette: Palette, personality: String, repo: Repo, schemaVersion: Int, species: String, traits: [String], visualPrompt: String?) {
        self.bornAt = bornAt
        self.id = id
        self.name = name
        self.palette = palette
        self.personality = personality
        self.repo = repo
        self.schemaVersion = schemaVersion
        self.species = species
        self.traits = traits
        self.visualPrompt = visualPrompt
    }
}

// MARK: Pet convenience initializers and mutators

public extension Pet {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Pet.self, from: data)
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
        bornAt: Date? = nil,
        id: String? = nil,
        name: String? = nil,
        palette: Palette? = nil,
        personality: String? = nil,
        repo: Repo? = nil,
        schemaVersion: Int? = nil,
        species: String? = nil,
        traits: [String]? = nil,
        visualPrompt: String?? = nil
    ) -> Pet {
        return Pet(
            bornAt: bornAt ?? self.bornAt,
            id: id ?? self.id,
            name: name ?? self.name,
            palette: palette ?? self.palette,
            personality: personality ?? self.personality,
            repo: repo ?? self.repo,
            schemaVersion: schemaVersion ?? self.schemaVersion,
            species: species ?? self.species,
            traits: traits ?? self.traits,
            visualPrompt: visualPrompt ?? self.visualPrompt
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

// MARK: - Palette
public struct Palette: Codable, Equatable {
    public let accent, outline, primary, secondary: String

    public init(accent: String, outline: String, primary: String, secondary: String) {
        self.accent = accent
        self.outline = outline
        self.primary = primary
        self.secondary = secondary
    }
}

// MARK: Palette convenience initializers and mutators

public extension Palette {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Palette.self, from: data)
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
        accent: String? = nil,
        outline: String? = nil,
        primary: String? = nil,
        secondary: String? = nil
    ) -> Palette {
        return Palette(
            accent: accent ?? self.accent,
            outline: outline ?? self.outline,
            primary: primary ?? self.primary,
            secondary: secondary ?? self.secondary
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

// MARK: - Repo
public struct Repo: Codable, Equatable {
    public let host: Host
    public let name, owner: String

    public init(host: Host, name: String, owner: String) {
        self.host = host
        self.name = name
        self.owner = owner
    }
}

// MARK: Repo convenience initializers and mutators

public extension Repo {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Repo.self, from: data)
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
        host: Host? = nil,
        name: String? = nil,
        owner: String? = nil
    ) -> Repo {
        return Repo(
            host: host ?? self.host,
            name: name ?? self.name,
            owner: owner ?? self.owner
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum Host: String, Codable, Equatable {
    case github = "github"
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
