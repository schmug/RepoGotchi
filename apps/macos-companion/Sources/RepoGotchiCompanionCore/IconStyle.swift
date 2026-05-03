import Foundation
import RepoGotchiContract

/// Maps a Mood to an SF Symbol + tint hint. The companion renders these as
/// the menubar icon. Animation policy is owned by the AppKit layer.
public struct IconStyle: Equatable, Sendable {
    public enum Tint: String, Equatable, Sendable {
        case label
        case secondary
        case pink
        case yellow
        case orange
        case red
        case blue
        case purple
        case gray
    }

    public let symbol: String
    public let tint: Tint
    public let accessibilityLabel: String

    public init(symbol: String, tint: Tint, accessibilityLabel: String) {
        self.symbol = symbol
        self.tint = tint
        self.accessibilityLabel = accessibilityLabel
    }
}

public enum IconStyleResolver {
    public static func style(for snapshot: PetSnapshot) -> IconStyle {
        let label = "\(snapshot.pet.name): \(snapshot.state.statusHeadline)"
        switch snapshot.state.mood {
        case .happy:
            return IconStyle(symbol: "heart.fill", tint: .pink, accessibilityLabel: label)
        case .excited:
            return IconStyle(symbol: "sparkles", tint: .yellow, accessibilityLabel: label)
        case .sad:
            return IconStyle(symbol: "cloud.rain.fill", tint: .blue, accessibilityLabel: label)
        case .sick:
            return IconStyle(symbol: "exclamationmark.triangle.fill", tint: .orange, accessibilityLabel: label)
        case .angry:
            return IconStyle(symbol: "exclamationmark.octagon.fill", tint: .red, accessibilityLabel: label)
        case .sleepy:
            return IconStyle(symbol: "moon.zzz.fill", tint: .secondary, accessibilityLabel: label)
        case .ghost:
            return IconStyle(symbol: "circle.dashed", tint: .gray, accessibilityLabel: label)
        }
    }
}
