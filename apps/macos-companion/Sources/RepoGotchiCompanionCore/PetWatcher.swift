import Foundation

/// Watches a single file via DispatchSource. Fires `onChange` on the queue
/// when the file is written or renamed. Recreates the descriptor on rename
/// so atomic writes (write tmp + rename) keep working.
public final class PetWatcher: @unchecked Sendable {
    private let url: URL
    private let queue: DispatchQueue
    private let onChange: () -> Void
    private var source: DispatchSourceFileSystemObject?
    private var fd: Int32 = -1

    public init(url: URL, queue: DispatchQueue = .main, onChange: @escaping () -> Void) {
        self.url = url
        self.queue = queue
        self.onChange = onChange
    }

    public func start() {
        stop()
        fd = open(url.path, O_EVTONLY)
        guard fd != -1 else { return }
        let source = DispatchSource.makeFileSystemObjectSource(
            fileDescriptor: fd,
            eventMask: [.write, .rename, .delete, .extend],
            queue: queue
        )
        source.setEventHandler { [weak self] in
            self?.onChange()
            self?.restartIfNeeded()
        }
        source.setCancelHandler { [fd] in
            if fd != -1 { close(fd) }
        }
        source.resume()
        self.source = source
    }

    public func stop() {
        source?.cancel()
        source = nil
        if fd != -1 {
            close(fd)
            fd = -1
        }
    }

    private func restartIfNeeded() {
        // After a rename or delete the original fd is detached; reopen.
        if let event = source?.data, event.contains(.rename) || event.contains(.delete) {
            start()
        }
    }

    deinit { stop() }
}
