# Binary Codec — HxCfgFile Pure Python Converter

A standalone, pure-Python binary/text codec for Hamilton HxCfgFile format files.

## Supported File Types

| Extension | Description |
|-----------|-------------|
| `.med`    | Method Editor Definition |
| `.rck`    | Rack definition |
| `.ctr`    | Container definition |
| `.tml`    | Template / Carrier definition |
| Any HxCfgFile v2/v3 | Generic support |

## Usage

### Command Line

```powershell
# Convert binary to text
python binary_codec/hxcfgfile_codec.py to-text input_binary.med output_text.med

# Convert text to binary  
python binary_codec/hxcfgfile_codec.py to-binary input_text.med output_binary.med

# Detect file format
python binary_codec/hxcfgfile_codec.py detect some_file.rck

# Roundtrip test
python binary_codec/hxcfgfile_codec.py roundtrip some_file.med
```

### As a Python Module

```python
from binary_codec.hxcfgfile_codec import (
    detect_format,
    parse_binary,
    parse_text,
    build_binary,
    build_text,
    read_hxcfg_file,
    parse_hxcfg_keyvalue,
    binary_to_text,
    text_to_binary,
)

# Read any HxCfgFile and get key-value dict
data = read_hxcfg_file('path/to/file.rck')
print(data['Dim.Dx'])  # → '127'

# Detect format
with open('file.med', 'rb') as f:
    fmt = detect_format(f.read())
    # → 'binary' or 'text'

# Full model access
with open('file.rck', 'rb') as f:
    raw = f.read()
model = parse_binary(raw)  # or parse_text(raw.decode())
text = build_text(model)
binary = build_binary(model)
```

## Dependencies

**None** — standard library only (`struct`, `re`, `argparse`, `pathlib`, `dataclasses`).

## Binary Format Reference

The HxCfgFile v3 binary layout:

1. `u16le` file version (2 or 3)
2. `u16le` ActivityData section marker (0 or 1)
3. If present: ActivityData header with short + var strings
4. `u8` section count + 3-byte pad
5. Repeated sections: short-string name, u16le version, u32le token count, var-string tokens
6. `\r\n` + footer checksum line

### String encodings

- **Short-string**: `u8 length` + bytes (Latin-1)
- **Var-string**: `u8 length` (≤254) or `0xFF + u16le length` + bytes
