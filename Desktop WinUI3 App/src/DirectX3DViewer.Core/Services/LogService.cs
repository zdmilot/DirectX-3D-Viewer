using System.Collections.Concurrent;

namespace DirectX3DViewer.Core.Services;

public enum LogLevel { Debug, Info, Warning, Error }

public readonly record struct LogEntry(DateTime Timestamp, LogLevel Level, string Message)
{
    public override string ToString() =>
        $"{Timestamp:HH:mm:ss.fff} [{Level.ToString().ToUpperInvariant()}] {Message}";
}

/// <summary>
/// Lightweight in-memory + rolling-file logger. Keeps a bounded buffer for the
/// in-app debug panel and appends to a log file in the app data folder.
/// </summary>
public sealed class LogService
{
    private const int MaxBuffer = 500;
    private readonly ConcurrentQueue<LogEntry> _buffer = new();
    private readonly string? _filePath;
    private readonly object _fileLock = new();

    public event Action<LogEntry>? EntryLogged;

    public LogService(string? overrideDir = null)
    {
        try
        {
            string dir = overrideDir ?? Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "DirectX3DViewer", "logs");
            Directory.CreateDirectory(dir);
            _filePath = Path.Combine(dir, $"session-{DateTime.Now:yyyyMMdd}.log");
        }
        catch
        {
            _filePath = null;
        }
    }

    public void Debug(string message) => Log(LogLevel.Debug, message);
    public void Info(string message) => Log(LogLevel.Info, message);
    public void Warn(string message) => Log(LogLevel.Warning, message);
    public void Error(string message) => Log(LogLevel.Error, message);

    public void Log(LogLevel level, string message)
    {
        var entry = new LogEntry(DateTime.Now, level, message);
        _buffer.Enqueue(entry);
        while (_buffer.Count > MaxBuffer) _buffer.TryDequeue(out _);

        if (_filePath is not null)
        {
            try
            {
                lock (_fileLock)
                    File.AppendAllText(_filePath, entry + Environment.NewLine);
            }
            catch { /* logging must never throw */ }
        }

        EntryLogged?.Invoke(entry);
    }

    public IReadOnlyList<LogEntry> Snapshot() => _buffer.ToArray();

    public string DumpText() => string.Join(Environment.NewLine, _buffer.Select(e => e.ToString()));
}
