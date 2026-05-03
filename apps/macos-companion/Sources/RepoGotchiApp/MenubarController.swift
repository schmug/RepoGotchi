import AppKit
import RepoGotchiCompanionCore

@MainActor
final class MenubarController {
    private let statusItem: NSStatusItem
    private let store: PetStore
    private var popover: NSPopover?

    init() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        store = PetStore { _ in } // re-bound below so we can capture self
    }

    func start() {
        // Re-bind the store callback now that we have a stable self reference.
        let store = PetStore(onChange: { [weak self] snap in
            Task { @MainActor in self?.render(snap) }
        })
        objc_setAssociatedObject(self, &storeKey, store, .OBJC_ASSOCIATION_RETAIN)
        store.start()
        renderEmpty()
    }

    private func render(_ snapshot: PetSnapshot?) {
        guard let snapshot else {
            renderEmpty()
            return
        }
        let style = IconStyleResolver.style(for: snapshot)
        if let button = statusItem.button {
            button.image = NSImage(
                systemSymbolName: style.symbol,
                accessibilityDescription: style.accessibilityLabel
            )
            button.image?.isTemplate = (style.tint == .label || style.tint == .secondary)
            button.contentTintColor = nsColor(for: style.tint)
            button.target = self
            button.action = #selector(togglePopover(_:))
        }
    }

    private func renderEmpty() {
        if let button = statusItem.button {
            button.image = NSImage(
                systemSymbolName: "circle.dotted",
                accessibilityDescription: "RepoGotchi: no pet found"
            )
            button.image?.isTemplate = true
            button.contentTintColor = nil
            button.target = self
            button.action = #selector(togglePopover(_:))
        }
    }

    @objc private func togglePopover(_ sender: Any?) {
        guard let button = statusItem.button else { return }
        if popover?.isShown == true {
            popover?.performClose(sender)
            return
        }
        let snap = (objc_getAssociatedObject(self, &storeKey) as? PetStore)?.snapshot
        let pop = NSPopover()
        pop.behavior = .transient
        pop.contentViewController = NSHostingControllerCompat(snapshot: snap)
        pop.show(relativeTo: button.bounds, of: button, preferredEdge: .minY)
        popover = pop
    }

    private func nsColor(for tint: IconStyle.Tint) -> NSColor? {
        switch tint {
        case .label: return nil
        case .secondary: return .secondaryLabelColor
        case .pink: return .systemPink
        case .yellow: return .systemYellow
        case .orange: return .systemOrange
        case .red: return .systemRed
        case .blue: return .systemBlue
        case .purple: return .systemPurple
        case .gray: return .systemGray
        }
    }
}

private nonisolated(unsafe) var storeKey: UInt8 = 0
