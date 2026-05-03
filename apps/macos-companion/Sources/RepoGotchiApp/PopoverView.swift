import AppKit
import SwiftUI
import RepoGotchiCompanionCore

/// SwiftUI view shown in the menubar popover. Minimal v0: pet identity,
/// status headline, scores, and a button to reveal the SVG in Finder.
struct PopoverView: View {
    let snapshot: PetSnapshot?

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if let snap = snapshot {
                petHeader(snap)
                Divider()
                scores(snap)
                Divider()
                footer(snap)
            } else {
                empty
            }
        }
        .padding(16)
        .frame(width: 280)
    }

    private func petHeader(_ snap: PetSnapshot) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(snap.pet.name)
                .font(.headline)
            Text("\(snap.pet.species) · level \(snap.state.level) \(snap.state.evolutionStage.rawValue)")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Text(snap.state.statusHeadline)
                .font(.body)
                .padding(.top, 4)
        }
    }

    private func scores(_ snap: PetSnapshot) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            scoreBar("Health", snap.state.scores.health, color: .green)
            scoreBar("Happiness", snap.state.scores.happiness, color: .yellow)
            scoreBar("Energy", snap.state.scores.energy, color: .blue)
            scoreBar("Cleanliness", snap.state.scores.cleanliness, color: .purple)
        }
    }

    private func scoreBar(_ label: String, _ value: Int, color: Color) -> some View {
        HStack(spacing: 8) {
            Text(label)
                .font(.caption)
                .frame(width: 80, alignment: .leading)
            ProgressView(value: Double(value), total: 100)
                .tint(color)
            Text("\(value)")
                .font(.caption.monospacedDigit())
                .frame(width: 30, alignment: .trailing)
        }
    }

    private func footer(_ snap: PetSnapshot) -> some View {
        HStack {
            Text("Updated \(snap.state.computedAt)")
                .font(.caption2)
                .foregroundStyle(.tertiary)
            Spacer()
            Button("Reveal SVG") {
                NSWorkspace.shared.activateFileViewerSelecting([snap.paths.svg])
            }
            .buttonStyle(.borderless)
            .font(.caption)
        }
    }

    private var empty: some View {
        VStack(spacing: 8) {
            Image(systemName: "circle.dotted")
                .font(.largeTitle)
                .foregroundStyle(.secondary)
            Text("No pet found.")
                .font(.headline)
            Text("Run `repogotchi init` in a repo to hatch one.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
    }
}

/// Tiny shim so MenubarController can build either an NSHostingController
/// or fall back if SwiftUI's hosting type changes shape across SDKs.
final class NSHostingControllerCompat: NSViewController {
    private let snapshot: PetSnapshot?

    init(snapshot: PetSnapshot?) {
        self.snapshot = snapshot
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) { fatalError("not used") }

    override func loadView() {
        let host = NSHostingView(rootView: PopoverView(snapshot: snapshot))
        host.translatesAutoresizingMaskIntoConstraints = false
        let container = NSView(frame: NSRect(x: 0, y: 0, width: 280, height: 220))
        container.addSubview(host)
        NSLayoutConstraint.activate([
            host.topAnchor.constraint(equalTo: container.topAnchor),
            host.bottomAnchor.constraint(equalTo: container.bottomAnchor),
            host.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            host.trailingAnchor.constraint(equalTo: container.trailingAnchor),
        ])
        view = container
    }
}
