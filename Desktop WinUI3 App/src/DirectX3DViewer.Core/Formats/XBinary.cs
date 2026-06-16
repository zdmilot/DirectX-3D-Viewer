using System.Globalization;
using System.Text;

namespace DirectX3DViewer.Core.Formats;

/// <summary>
/// Converts a binary DirectX <c>.x</c> token stream into the equivalent text
/// representation so it can be parsed by <see cref="XReader"/>. Tokens are read
/// little-endian per the DirectX binary <c>.x</c> specification.
/// </summary>
internal static class XBinary
{
    private const int TOKEN_NAME = 1;
    private const int TOKEN_STRING = 2;
    private const int TOKEN_INTEGER = 3;
    private const int TOKEN_GUID = 5;
    private const int TOKEN_INTEGER_LIST = 6;
    private const int TOKEN_FLOAT_LIST = 7;
    private const int TOKEN_OBRACE = 10;
    private const int TOKEN_CBRACE = 11;
    private const int TOKEN_COMMA = 19;
    private const int TOKEN_SEMICOLON = 20;
    private const int TOKEN_TEMPLATE = 31;

    public static string ToText(byte[] data, int offset, List<string> warnings, int floatBits = 32)
    {
        var sb = new StringBuilder(data.Length * 2);
        int i = offset;
        int n = data.Length;
        int templateDepth = 0;

        while (i + 2 <= n)
        {
            int token = data[i] | (data[i + 1] << 8);
            i += 2;

            switch (token)
            {
                case TOKEN_NAME:
                {
                    if (i + 4 > n) return sb.ToString();
                    int len = ReadInt32(data, i); i += 4;
                    if (i + len > n) return sb.ToString();
                    string name = Encoding.ASCII.GetString(data, i, len);
                    i += len;
                    if (templateDepth == 0) sb.Append(name).Append(' ');
                    break;
                }
                case TOKEN_STRING:
                {
                    if (i + 4 > n) return sb.ToString();
                    int len = ReadInt32(data, i); i += 4;
                    if (i + len > n) return sb.ToString();
                    string str = Encoding.ASCII.GetString(data, i, len);
                    i += len + 2; // trailing separator token
                    if (templateDepth == 0) sb.Append('"').Append(str).Append("\" ");
                    break;
                }
                case TOKEN_INTEGER:
                {
                    if (i + 4 > n) return sb.ToString();
                    int v = ReadInt32(data, i); i += 4;
                    if (templateDepth == 0) sb.Append(v.ToString(CultureInfo.InvariantCulture)).Append("; ");
                    break;
                }
                case TOKEN_GUID:
                    i += 16; // ignored
                    break;
                case TOKEN_INTEGER_LIST:
                {
                    if (i + 4 > n) return sb.ToString();
                    int count = ReadInt32(data, i); i += 4;
                    for (int k = 0; k < count && i + 4 <= n; k++, i += 4)
                    {
                        int v = ReadInt32(data, i);
                        if (templateDepth == 0) sb.Append(v.ToString(CultureInfo.InvariantCulture)).Append(' ');
                    }
                    break;
                }
                case TOKEN_FLOAT_LIST:
                {
                    if (i + 4 > n) return sb.ToString();
                    int count = ReadInt32(data, i); i += 4;
                    int step = floatBits == 64 ? 8 : 4;
                    for (int k = 0; k < count && i + step <= n; k++, i += step)
                    {
                        double v = floatBits == 64
                            ? BitConverter.ToDouble(data, i)
                            : BitConverter.ToSingle(data, i);
                        if (templateDepth == 0)
                            sb.Append(v.ToString("R", CultureInfo.InvariantCulture)).Append(' ');
                    }
                    break;
                }
                case TOKEN_OBRACE:
                    if (templateDepth > 0) templateDepth++;
                    else sb.Append("{ ");
                    break;
                case TOKEN_CBRACE:
                    if (templateDepth > 0) templateDepth--;
                    else sb.Append("} ");
                    break;
                case TOKEN_COMMA:
                    if (templateDepth == 0) sb.Append(' ');
                    break;
                case TOKEN_SEMICOLON:
                    if (templateDepth == 0) sb.Append(' ');
                    break;
                case TOKEN_TEMPLATE:
                    templateDepth = 1; // skip the template definition block entirely
                    break;
                default:
                    // Unknown token id: stop to avoid desync.
                    warnings.Add($"Unrecognised binary .x token {token}; parsing truncated.");
                    return sb.ToString();
            }
        }
        return sb.ToString();
    }

    private static int ReadInt32(byte[] d, int i) =>
        d[i] | (d[i + 1] << 8) | (d[i + 2] << 16) | (d[i + 3] << 24);
}
