#!/usr/bin/env python3
"""
HxCfgFile v3 Binary Codec — Pure Python
========================================
Convert Hamilton HxCfgFile format files between binary and text
representations without COM objects or external executables.

Supports:
  - .med (Method Editor Definition)
  - .rck (Rack), .ctr (Container), .tml (Template/Carrier)
  - Any HxCfgFile v2/v3 formatted file

Standalone — standard library only (struct, re, argparse, pathlib, dataclasses).

Usage:
    python hxcfgfile_codec.py to-text  input_binary output_text
    python hxcfgfile_codec.py to-binary input_text   output_binary
    python hxcfgfile_codec.py detect    input_file
    python hxcfgfile_codec.py roundtrip input_file   [output_dir]
"""

import argparse
import hashlib
import os
import re
import struct
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional, Tuple


# ═══════════════════════════════════════════════════════════════
#  Constants
# ═══════════════════════════════════════════════════════════════

HXCFG_VERSIONS = (2, 3)
ENCODING = 'latin-1'  # Hamilton uses Latin-1 / Windows-1252

FOOTER_RE = re.compile(
    r'^\*\s+\$\$author=(.+?)\$\$valid=(.+?)\$\$time=(.+?)'
    r'\$\$checksum=([0-9a-fA-F]+)\$\$length=(\d+)\$\$',
    re.MULTILINE,
)

SECTION_HEADER_RE = re.compile(
    r'^DataDef,\s*(HxPars|RECTRACK|TEMPLATE|ActivityData)\s*,\s*(\d+)\s*,\s*(.+?)\s*,$',
    re.MULTILINE,
)


# ═══════════════════════════════════════════════════════════════
#  Data Models
# ═══════════════════════════════════════════════════════════════

@dataclass
class HxParsSection:
    """A single HxPars key-value section."""
    section_type: str     # 'HxPars', 'RECTRACK', 'TEMPLATE', etc.
    version: int          # Section version (2 or 3)
    key: str              # Section key name
    tokens: List[str] = field(default_factory=list)


@dataclass
class ActivityDataSection:
    """The ActivityData header block."""
    key: str = 'ActivityData'
    value: str = ''       # base64 blob or value string


@dataclass
class HxCfgFileModel:
    """Complete parsed model of an HxCfgFile."""
    file_version: int = 3
    config_valid: str = 'Y'
    activity_data: Optional[ActivityDataSection] = None
    sections: List[HxParsSection] = field(default_factory=list)
    footer_author: str = ''
    footer_valid: str = '1'
    footer_time: str = ''
    footer_checksum: str = ''
    footer_length: str = ''


# ═══════════════════════════════════════════════════════════════
#  Detection — is file binary or text?
# ═══════════════════════════════════════════════════════════════

def detect_format(data: bytes) -> str:
    """Detect whether raw bytes are binary or text HxCfgFile.
    
    Returns: 'binary', 'text', or 'unknown'
    """
    if len(data) < 4:
        return 'unknown'

    # Check for BOM (UTF-16LE)
    if data[:2] in (b'\xff\xfe', b'\xfe\xff'):
        text = data.decode('utf-16-le', errors='replace').lstrip('\ufeff')
        if text.startswith('HxCfgFile,'):
            return 'text'
        return 'unknown'

    # Check for text header
    try:
        head = data[:30].decode(ENCODING, errors='replace')
        if head.startswith('HxCfgFile,'):
            return 'text'
    except Exception:
        pass

    # Check for binary version marker (u16le = 2 or 3)
    ver = struct.unpack_from('<H', data, 0)[0]
    if ver in HXCFG_VERSIONS:
        return 'binary'

    return 'unknown'


# ═══════════════════════════════════════════════════════════════
#  Binary Primitives — read/write
# ═══════════════════════════════════════════════════════════════

class BinaryReader:
    """Sequential reader for binary HxCfgFile data."""

    def __init__(self, data: bytes):
        self.data = data
        self.pos = 0

    def remaining(self) -> int:
        return len(self.data) - self.pos

    def read_bytes(self, n: int) -> bytes:
        if self.pos + n > len(self.data):
            raise ValueError(f'Read past end: pos={self.pos}, need={n}, have={len(self.data)}')
        result = self.data[self.pos:self.pos + n]
        self.pos += n
        return result

    def read_u8(self) -> int:
        return struct.unpack_from('B', self.data, self._advance(1))[0]

    def read_u16le(self) -> int:
        return struct.unpack_from('<H', self.data, self._advance(2))[0]

    def read_u32le(self) -> int:
        return struct.unpack_from('<I', self.data, self._advance(4))[0]

    def read_short_string(self) -> str:
        """Read u8-length-prefixed string (latin1)."""
        length = self.read_u8()
        raw = self.read_bytes(length)
        return raw.decode(ENCODING)

    def read_var_string(self) -> str:
        """Read variable-length string: u8 len or 0xFF + u16le len."""
        first = self.read_u8()
        if first == 0xFF:
            length = self.read_u16le()
        else:
            length = first
        raw = self.read_bytes(length)
        return raw.decode(ENCODING)

    def _advance(self, n: int) -> int:
        pos = self.pos
        if pos + n > len(self.data):
            raise ValueError(f'Read past end: pos={pos}, need={n}, have={len(self.data)}')
        self.pos += n
        return pos


class BinaryWriter:
    """Sequential writer for binary HxCfgFile data."""

    def __init__(self):
        self.buf = bytearray()

    def write_bytes(self, data: bytes):
        self.buf.extend(data)

    def write_u8(self, val: int):
        self.buf.append(val & 0xFF)

    def write_u16le(self, val: int):
        self.buf.extend(struct.pack('<H', val))

    def write_u32le(self, val: int):
        self.buf.extend(struct.pack('<I', val))

    def write_short_string(self, s: str):
        encoded = s.encode(ENCODING)
        if len(encoded) > 255:
            raise ValueError(f'Short string too long: {len(encoded)} bytes')
        self.write_u8(len(encoded))
        self.write_bytes(encoded)

    def write_var_string(self, s: str):
        encoded = s.encode(ENCODING)
        if len(encoded) <= 254:
            self.write_u8(len(encoded))
        else:
            self.write_u8(0xFF)
            self.write_u16le(len(encoded))
        self.write_bytes(encoded)

    def get_bytes(self) -> bytes:
        return bytes(self.buf)


# ═══════════════════════════════════════════════════════════════
#  Binary Parser — parse binary → model
# ═══════════════════════════════════════════════════════════════

def parse_binary(data: bytes) -> HxCfgFileModel:
    """Parse binary HxCfgFile data into a structured model."""
    reader = BinaryReader(data)
    model = HxCfgFileModel()

    # File version
    model.file_version = reader.read_u16le()
    if model.file_version not in HXCFG_VERSIONS:
        raise ValueError(f'Unsupported HxCfgFile version: {model.file_version}')

    # ActivityData header block
    section_type = reader.read_u16le()  # 1 = ActivityData present
    if section_type == 1:
        section_name_count = reader.read_u32le()
        section_name = reader.read_short_string()
        field_type = reader.read_u16le()
        field_count = reader.read_u32le()
        key = reader.read_short_string()
        value = reader.read_var_string()
        model.activity_data = ActivityDataSection(key=key, value=value)

    # HxPars section count
    section_count = reader.read_u8()

    # 3-byte pad
    pad = reader.read_bytes(3)

    # Read each HxPars section
    for _ in range(section_count):
        section_name = reader.read_short_string()
        # Parse "HxPars,<key>" or "RECTRACK,<key>" etc.
        parts = section_name.split(',', 1)
        sec_type = parts[0] if len(parts) > 0 else 'HxPars'
        sec_key = parts[1] if len(parts) > 1 else ''

        pars_version = reader.read_u16le()
        token_count = reader.read_u32le()

        tokens = []
        for _ in range(token_count):
            tokens.append(reader.read_var_string())

        section = HxParsSection(
            section_type=sec_type,
            version=pars_version,
            key=sec_key,
            tokens=tokens,
        )
        model.sections.append(section)

    # Footer line (if remaining data has text)
    remaining = data[reader.pos:]
    try:
        footer_text = remaining.decode(ENCODING).strip()
        m = FOOTER_RE.search(footer_text)
        if m:
            model.footer_author = m.group(1)
            model.footer_valid = m.group(2)
            model.footer_time = m.group(3)
            model.footer_checksum = m.group(4)
            model.footer_length = m.group(5)
    except Exception:
        pass

    return model


# ═══════════════════════════════════════════════════════════════
#  Binary Writer — model → binary
# ═══════════════════════════════════════════════════════════════

def build_binary(model: HxCfgFileModel) -> bytes:
    """Serialize a model back to binary HxCfgFile format."""
    writer = BinaryWriter()

    # File version
    writer.write_u16le(model.file_version)

    # ActivityData
    if model.activity_data:
        writer.write_u16le(1)  # section type present
        writer.write_u32le(1)  # section-name count
        writer.write_short_string(f'ActivityData,{model.activity_data.key}')
        writer.write_u16le(1)  # field type
        writer.write_u32le(1)  # field count
        writer.write_short_string('ActivityDocument')
        writer.write_var_string(model.activity_data.value)
    else:
        writer.write_u16le(0)

    # Section count
    writer.write_u8(len(model.sections))
    # 3-byte pad
    writer.write_bytes(b'\x00\x00\x00')

    # Sections
    for section in model.sections:
        section_name = f'{section.section_type},{section.key}'
        writer.write_short_string(section_name)
        writer.write_u16le(section.version)
        writer.write_u32le(len(section.tokens))
        for token in section.tokens:
            writer.write_var_string(token)

    # Footer
    footer = build_footer(model)
    writer.write_bytes(b'\r\n')
    writer.write_bytes(footer.encode(ENCODING))

    return writer.get_bytes()


def build_footer(model: HxCfgFileModel) -> str:
    """Build the footer checksum line."""
    author = model.footer_author or 'SYSTEM'
    valid = model.footer_valid or '1'
    time_str = model.footer_time or ''
    checksum = model.footer_checksum or '00000000'
    length = model.footer_length or '000'
    return f'* $$author={author}$$valid={valid}$$time={time_str}$$checksum={checksum}$$length={length}$$'


# ═══════════════════════════════════════════════════════════════
#  Text Parser — parse text → model
# ═══════════════════════════════════════════════════════════════

def parse_text(text: str) -> HxCfgFileModel:
    """Parse text-format HxCfgFile into a structured model."""
    model = HxCfgFileModel()

    # Strip BOM
    text = text.lstrip('\ufeff\ufffe')

    # Parse header version
    header_match = re.match(r'HxCfgFile\s*,\s*(\d+)\s*;', text)
    if header_match:
        model.file_version = int(header_match.group(1))

    # Config valid
    valid_match = re.search(r'ConfigIsValid\s*,\s*(\w)\s*;', text)
    if valid_match:
        model.config_valid = valid_match.group(1)

    # Parse DataDef sections
    # Find all DataDef blocks: DataDef, TYPE, VERSION, KEY, { ... } or [ ... ]
    datadef_re = re.compile(
        r'DataDef\s*,\s*(\w+)\s*,\s*(\d+)\s*,\s*(.+?)\s*,\s*'
        r'([{\[])(.*?)([}\]])\s*;',
        re.DOTALL,
    )

    for m in datadef_re.finditer(text):
        sec_type = m.group(1)
        sec_ver = int(m.group(2))
        sec_key = m.group(3).strip()
        open_brace = m.group(4)
        body = m.group(5)
        close_brace = m.group(6)

        if sec_type == 'ActivityData':
            # Parse key-value pairs
            kv_re = re.compile(r'^\s*(\w+)\s*,\s*"((?:[^"\\]|\\.)*)"\s*$', re.MULTILINE)
            for kv in kv_re.finditer(body):
                if kv.group(1) == 'ActivityDocument':
                    model.activity_data = ActivityDataSection(
                        key='ActivityData',
                        value=kv.group(2),
                    )
        elif sec_type in ('HxPars', 'RECTRACK', 'TEMPLATE'):
            # Parse token list [...] or key-value block {...}
            tokens = []
            if open_brace == '[':
                # Token array: [ "token1", "token2", ... ]
                tok_re = re.compile(r'"((?:[^"\\]|\\.)*)"')
                tokens = [t.group(1) for t in tok_re.finditer(body)]
            else:
                # Key-value block: { key, "value", ... }
                kv_re = re.compile(r'^\s*([A-Za-z0-9_.]+)\s*,\s*"((?:[^"\\]|\\.)*)"\s*$', re.MULTILINE)
                for kv in kv_re.finditer(body):
                    tokens.append(kv.group(1))
                    tokens.append(kv.group(2))

            section = HxParsSection(
                section_type=sec_type,
                version=sec_ver,
                key=sec_key,
                tokens=tokens,
            )
            model.sections.append(section)

    # Parse footer
    footer_match = FOOTER_RE.search(text)
    if footer_match:
        model.footer_author = footer_match.group(1)
        model.footer_valid = footer_match.group(2)
        model.footer_time = footer_match.group(3)
        model.footer_checksum = footer_match.group(4)
        model.footer_length = footer_match.group(5)

    return model


# ═══════════════════════════════════════════════════════════════
#  Text Writer — model → text
# ═══════════════════════════════════════════════════════════════

def build_text(model: HxCfgFileModel) -> str:
    """Serialize a model to text HxCfgFile format."""
    lines = []
    lines.append(f'HxCfgFile,{model.file_version};')
    lines.append('')
    lines.append(f'ConfigIsValid,{model.config_valid};')
    lines.append('')

    # ActivityData
    if model.activity_data:
        lines.append(f'DataDef,ActivityData,1,ActivityData,')
        lines.append('{')
        lines.append(f'ActivityDocument, "{model.activity_data.value}"')
        lines.append('};')
        lines.append('')

    # HxPars / RECTRACK / TEMPLATE sections
    for section in model.sections:
        lines.append(f'DataDef,{section.section_type},{section.version},{section.key},')

        if section.section_type in ('RECTRACK', 'TEMPLATE'):
            # Key-value block format
            lines.append('{')
            for i in range(0, len(section.tokens) - 1, 2):
                key = section.tokens[i]
                val = section.tokens[i + 1] if i + 1 < len(section.tokens) else ''
                lines.append(f'{key}, "{val}",')
            lines.append('};')
        else:
            # Token array format
            lines.append('[')
            for token in section.tokens:
                lines.append(f'"{token}",')
            lines.append('];')

        lines.append('')

    # Footer
    footer = build_footer(model)
    lines.append(footer)

    return '\r\n'.join(lines) + '\r\n'


# ═══════════════════════════════════════════════════════════════
#  High-level Conversion Functions
# ═══════════════════════════════════════════════════════════════

def binary_to_text(input_path: str, output_path: str):
    """Convert a binary HxCfgFile to text."""
    data = Path(input_path).read_bytes()
    fmt = detect_format(data)
    if fmt == 'text':
        print(f'File is already text format: {input_path}')
        Path(output_path).write_text(
            data.decode(ENCODING),
            encoding=ENCODING,
        )
        return
    if fmt != 'binary':
        raise ValueError(f'Cannot detect format of: {input_path}')

    model = parse_binary(data)
    text = build_text(model)
    Path(output_path).write_text(text, encoding=ENCODING)
    print(f'Converted binary → text: {output_path}')


def text_to_binary(input_path: str, output_path: str):
    """Convert a text HxCfgFile to binary."""
    raw = Path(input_path).read_bytes()
    fmt = detect_format(raw)
    if fmt == 'binary':
        print(f'File is already binary format: {input_path}')
        Path(output_path).write_bytes(raw)
        return
    if fmt != 'text':
        raise ValueError(f'Cannot detect format of: {input_path}')

    # Decode with possible BOM handling
    if raw[:2] in (b'\xff\xfe', b'\xfe\xff'):
        text = raw.decode('utf-16-le').lstrip('\ufeff')
    else:
        text = raw.decode(ENCODING)

    model = parse_text(text)
    binary_data = build_binary(model)
    Path(output_path).write_bytes(binary_data)
    print(f'Converted text → binary: {output_path}')


def roundtrip_test(input_path: str, output_dir: str = None):
    """Test roundtrip conversion: binary → text → binary → text, verify stability."""
    data = Path(input_path).read_bytes()
    fmt = detect_format(data)
    name = Path(input_path).stem

    if output_dir is None:
        output_dir = str(Path(input_path).parent)
    os.makedirs(output_dir, exist_ok=True)

    if fmt == 'binary':
        # binary → text
        model1 = parse_binary(data)
        text1 = build_text(model1)

        # text → binary
        model2 = parse_text(text1)
        binary2 = build_binary(model2)

        # binary → text (again)
        model3 = parse_binary(binary2)
        text2 = build_text(model3)

        stable = text1 == text2
        print(f'Roundtrip ({name}): binary → text → binary → text')
        print(f'  Text outputs equal: {stable}')

        Path(os.path.join(output_dir, f'{name}_rt_text1.txt')).write_text(text1, encoding=ENCODING)
        Path(os.path.join(output_dir, f'{name}_rt_text2.txt')).write_text(text2, encoding=ENCODING)
        return stable

    elif fmt == 'text':
        if data[:2] in (b'\xff\xfe', b'\xfe\xff'):
            text_orig = data.decode('utf-16-le').lstrip('\ufeff')
        else:
            text_orig = data.decode(ENCODING)

        model1 = parse_text(text_orig)
        binary1 = build_binary(model1)

        model2 = parse_binary(binary1)
        text2 = build_text(model2)

        model3 = parse_text(text2)
        binary2 = build_binary(model3)

        stable = binary1 == binary2
        print(f'Roundtrip ({name}): text → binary → text → binary')
        print(f'  Binary outputs equal: {stable}')
        return stable

    else:
        raise ValueError(f'Cannot detect format: {input_path}')


# ═══════════════════════════════════════════════════════════════
#  HxCfgFile Key-Value Helpers (for .rck, .ctr, .tml parsing)
# ═══════════════════════════════════════════════════════════════

def parse_hxcfg_keyvalue(text: str) -> dict:
    """Parse HxCfgFile text block into a flat key-value dictionary.
    
    Works with RECTRACK, TEMPLATE, and other block formats.
    Returns all keys as strings → strings.
    """
    result = {}
    open_idx = text.find('{')
    close_idx = text.rfind('}')
    if open_idx < 0 or close_idx < 0:
        return result
    body = text[open_idx + 1:close_idx]
    kv_re = re.compile(r'^\s*([A-Za-z0-9_.]+)\s*,\s*"([^"]*)"', re.MULTILINE)
    for m in kv_re.finditer(body):
        result[m.group(1)] = m.group(2)
    return result


def read_hxcfg_file(path: str) -> dict:
    """Read an HxCfgFile and return key-value dictionary.
    
    Handles both binary and text formats, and UTF-16LE encoding.
    """
    data = Path(path).read_bytes()
    fmt = detect_format(data)

    if fmt == 'binary':
        model = parse_binary(data)
        text = build_text(model)
    elif fmt == 'text':
        if data[:2] in (b'\xff\xfe', b'\xfe\xff'):
            text = data.decode('utf-16-le').lstrip('\ufeff')
        else:
            text = data.decode(ENCODING)
    else:
        raise ValueError(f'Cannot detect HxCfgFile format: {path}')

    return parse_hxcfg_keyvalue(text)


# ═══════════════════════════════════════════════════════════════
#  CLI Entry Point
# ═══════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description='HxCfgFile v3 Binary Codec — Pure Python',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    sub = parser.add_subparsers(dest='command', help='Conversion command')

    # to-text
    p_text = sub.add_parser('to-text', help='Convert binary → text')
    p_text.add_argument('input', help='Input binary file')
    p_text.add_argument('output', help='Output text file')

    # to-binary
    p_bin = sub.add_parser('to-binary', help='Convert text → binary')
    p_bin.add_argument('input', help='Input text file')
    p_bin.add_argument('output', help='Output binary file')

    # detect
    p_det = sub.add_parser('detect', help='Detect file format')
    p_det.add_argument('input', help='File to detect')

    # roundtrip
    p_rt = sub.add_parser('roundtrip', help='Roundtrip test')
    p_rt.add_argument('input', help='Input file')
    p_rt.add_argument('output_dir', nargs='?', default=None, help='Output directory')

    args = parser.parse_args()

    if args.command == 'to-text':
        binary_to_text(args.input, args.output)
    elif args.command == 'to-binary':
        text_to_binary(args.input, args.output)
    elif args.command == 'detect':
        data = Path(args.input).read_bytes()
        fmt = detect_format(data)
        print(f'{args.input}: {fmt}')
    elif args.command == 'roundtrip':
        ok = roundtrip_test(args.input, args.output_dir)
        sys.exit(0 if ok else 1)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
