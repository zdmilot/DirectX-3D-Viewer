using System.Globalization;

namespace DirectX3DViewer.Core.Formats;

/// <summary>
/// A forgiving tokenizer for DirectX <c>.x</c> text data. Treats <c>;</c> and
/// <c>,</c> as separators (the templates are parsed positionally against their
/// known schema), recognises <c>{</c>/<c>}</c> braces and quoted strings, and
/// skips <c>//</c> and <c>#</c> comments.
/// </summary>
internal sealed class XReader
{
    private readonly string _s;
    private int _i;
    private readonly int _n;

    public XReader(string text, int start = 0)
    {
        _s = text;
        _i = Math.Clamp(start, 0, text.Length);
        _n = text.Length;
    }

    public bool Eof
    {
        get
        {
            SkipTrivia();
            return _i >= _n;
        }
    }

    private void SkipTrivia()
    {
        while (_i < _n)
        {
            char c = _s[_i];
            if (c == '/' && _i + 1 < _n && _s[_i + 1] == '/') { SkipLine(); continue; }
            if (c == '#') { SkipLine(); continue; }
            if (char.IsWhiteSpace(c) || c == ',' || c == ';') { _i++; continue; }
            break;
        }
    }

    private void SkipLine()
    {
        while (_i < _n && _s[_i] != '\n') _i++;
    }

    /// <summary>Read the next token, or <c>null</c> at end of input.</summary>
    public string? Next()
    {
        SkipTrivia();
        if (_i >= _n) return null;

        char c = _s[_i];
        if (c == '{' || c == '}')
        {
            _i++;
            return c.ToString();
        }

        if (c == '"')
        {
            _i++;
            int s0 = _i;
            while (_i < _n && _s[_i] != '"') _i++;
            string str = _s.Substring(s0, _i - s0);
            if (_i < _n) _i++; // closing quote
            return str;
        }

        int start = _i;
        while (_i < _n)
        {
            char d = _s[_i];
            if (char.IsWhiteSpace(d) || d is ',' or ';' or '{' or '}') break;
            _i++;
        }
        return _s.Substring(start, _i - start);
    }

    public string Peek()
    {
        int save = _i;
        string? t = Next();
        _i = save;
        return t ?? string.Empty;
    }

    public int ReadInt()
    {
        string? t = Next();
        if (t is null) throw new FormatException("Unexpected end of .x data (expected integer).");
        // Some exporters append stray characters; parse leading integer.
        return (int)ParseLong(t);
    }

    public float ReadFloat()
    {
        string? t = Next();
        if (t is null) throw new FormatException("Unexpected end of .x data (expected float).");
        return (float)ParseDouble(t);
    }

    public string ReadName()
    {
        string? t = Next();
        if (t is null) throw new FormatException("Unexpected end of .x data (expected name).");
        return t;
    }

    /// <summary>Expect and consume an opening brace.</summary>
    public void ExpectOpen()
    {
        string? t = Next();
        if (t != "{") throw new FormatException($"Expected '{{' but found '{t}'.");
    }

    /// <summary>
    /// Consume tokens until the brace that matches an already-consumed <c>{</c>.
    /// Used to skip unknown nodes and template definitions.
    /// </summary>
    public void SkipBlockBody()
    {
        int depth = 1;
        while (depth > 0)
        {
            string? t = Next();
            if (t is null) return;
            if (t == "{") depth++;
            else if (t == "}") depth--;
        }
    }

    private static long ParseLong(string s)
    {
        if (long.TryParse(s, NumberStyles.Integer, CultureInfo.InvariantCulture, out long v))
            return v;
        // Fallback: strip to a leading signed integer prefix.
        int i = 0;
        if (i < s.Length && (s[i] == '-' || s[i] == '+')) i++;
        int start = i;
        while (i < s.Length && char.IsDigit(s[i])) i++;
        if (i > start && long.TryParse(s.AsSpan(0, i), NumberStyles.Integer, CultureInfo.InvariantCulture, out v))
            return v;
        return 0;
    }

    private static double ParseDouble(string s)
    {
        if (double.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out double v))
            return v;
        return 0;
    }
}
