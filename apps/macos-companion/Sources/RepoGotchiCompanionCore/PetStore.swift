import Foundation

/// Owns the currently-displayed pet, watches its state.json, and rescans for
/// new pets every `discoveryInterval`. Notifies subscribers via `onChange`.
@MainActor
public final class PetStore {
    public private(set) var snapshot: PetSnapshot?

    private let home: URL
    private let discoveryInterval: TimeInterval
    private let onChange: (PetSnapshot?) -> Void

    private var watcher: PetWatcher?
    private var discoveryTimer: Timer?

    public init(
        home: URL = FileManager.default.homeDirectoryForCurrentUser,
        discoveryInterval: TimeInterval = 30,
        onChange: @escaping (PetSnapshot?) -> Void
    ) {
        self.home = home
        self.discoveryInterval = discoveryInterval
        self.onChange = onChange
    }

    public func start() {
        reload()
        discoveryTimer?.invalidate()
        discoveryTimer = Timer.scheduledTimer(withTimeInterval: discoveryInterval, repeats: true) { [weak self] _ in
            // Re-capture weakly inside the Task so strict concurrency is happy
            // about crossing the actor boundary.
            Task { @MainActor [weak self] in
                self?.reload()
            }
        }
    }

    public func stop() {
        discoveryTimer?.invalidate()
        discoveryTimer = nil
        watcher?.stop()
        watcher = nil
    }

    public func reload() {
        guard let paths = PetDiscovery.mostRecent(home: home) else {
            update(to: nil)
            return
        }
        do {
            let snap = try PetLoader.load(paths)
            update(to: snap)
            attachWatcher(to: paths)
        } catch {
            update(to: nil)
        }
    }

    private func update(to next: PetSnapshot?) {
        if next == snapshot { return }
        snapshot = next
        onChange(next)
    }

    private func attachWatcher(to paths: PetPaths) {
        watcher?.stop()
        watcher = PetWatcher(url: paths.state) { [weak self] in
            Task { @MainActor [weak self] in
                self?.reload()
            }
        }
        watcher?.start()
    }
}
