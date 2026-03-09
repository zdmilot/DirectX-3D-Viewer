#!/usr/bin/env python3
"""Dump raw shape of TIP_CAR_480 frames."""
import zlib, re

with open('Base Hamilton Files/Labware/ML_STAR/TIP_CAR_480_A00.hxx', 'rb') as f:
    data = f.read()

compressed = data[46+10:]
decompressed = zlib.decompress(compressed, -zlib.MAX_WBITS)
text = decompressed.decode('utf-8', errors='replace')

# Find Frame Poly_Geom_Data and show its structure
idx = text.find('Frame Poly_Geom_Data')
if idx >= 0:
    print('=== Frame Poly_Geom_Data (first 3000 chars) ===')
    print(text[idx:idx+3000])
    print()

# Find first child frame (Frm4) and show
idx2 = text.find('Frame Frm4')
if idx2 >= 0:
    print('=== Frame Frm4 (first 2000 chars) ===')
    print(text[idx2:idx2+2000])
