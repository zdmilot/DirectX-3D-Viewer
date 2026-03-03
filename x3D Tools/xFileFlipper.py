import re
from dataclasses import dataclass
from pathlib import Path

# =========================
# HARD-CODED PATHS
# =========================
IN_PATH  = r"C:\Program Files (x86)\Hamilton\Labware\stx2\9041000.x"
OUT_PATH = r"C:\Users\admin\Desktop\LiconicFlipped.x"

# Mirror across plane:
#   'x' => x = -x (left/right flip)
#   'y' => y = -y (up/down flip)
#   'z' => z = -z (front/back flip)
MIRROR_AXIS = "x"


@dataclass
class Lexer:
    s: str
    i: int = 0
    n: int = 0

    def __post_init__(self):
        self.n = len(self.s)

    def peek(self) -> str:
        return self.s[self.i] if self.i < self.n else ""

    def skip_ws_comments(self) -> None:
        while self.i < self.n:
            c = self.s[self.i]
            if c.isspace():
                self.i += 1
                continue
            # line comment //
            if c == "/" and self.i + 1 < self.n and self.s[self.i + 1] == "/":
                self.i += 2
                while self.i < self.n and self.s[self.i] not in "\r\n":
                    self.i += 1
                continue
            # block comment /* ... */
            if c == "/" and self.i + 1 < self.n and self.s[self.i + 1] == "*":
                self.i += 2
                while self.i + 1 < self.n and not (self.s[self.i] == "*" and self.s[self.i + 1] == "/"):
                    self.i += 1
                if self.i + 1 < self.n:
                    self.i += 2
                continue
            break

    def expect(self, ch: str) -> None:
        self.skip_ws_comments()
        if self.peek() != ch:
            raise ValueError(f"Expected '{ch}' at {self.i}, got '{self.peek()}'")
        self.i += 1

    def read_word(self):
        self.skip_ws_comments()
        j = self.i
        if j >= self.n or not (self.s[j].isalpha() or self.s[j] == "_"):
            return None
        self.i += 1
        while self.i < self.n and (self.s[self.i].isalnum() or self.s[self.i] in "_."):
            self.i += 1
        return self.s[j:self.i]

    def read_number_token(self) -> str:
        self.skip_ws_comments()
        j = self.i
        if j >= self.n:
            raise ValueError("EOF reading number")

        if self.s[self.i] in "+-":
            self.i += 1

        has_digit = False
        while self.i < self.n and self.s[self.i].isdigit():
            self.i += 1
            has_digit = True

        if self.i < self.n and self.s[self.i] == ".":
            self.i += 1
            while self.i < self.n and self.s[self.i].isdigit():
                self.i += 1
                has_digit = True

        if self.i < self.n and self.s[self.i] in "eE":
            self.i += 1
            if self.i < self.n and self.s[self.i] in "+-":
                self.i += 1
            while self.i < self.n and self.s[self.i].isdigit():
                self.i += 1
                has_digit = True

        if not has_digit:
            raise ValueError(f"Invalid number at {j}")

        return self.s[j:self.i]

    def read_int(self) -> int:
        return int(float(self.read_number_token()))

    def read_float(self) -> float:
        return float(self.read_number_token())


def flip_polygon(indices):
    # For reflection, flip winding. A simple consistent approach:
    # keep the first vertex, reverse the rest: [a,b,c,d] -> [a,d,c,b]
    if len(indices) <= 2:
        return indices
    return [indices[0]] + list(reversed(indices[1:]))


def extract_brace_block(s: str, start: int):
    # start points at 'Mesh' token in the main file
    brace = s.find("{", start)
    if brace == -1:
        raise ValueError("No '{' after Mesh token")

    depth = 0
    i = brace
    n = len(s)
    while i < n:
        ch = s[i]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return s[start:i + 1], i + 1
        i += 1

    raise ValueError("Unterminated brace block")


def process_mesh_block(block: str, axis: str) -> str:
    m = re.match(r"\s*Mesh\b", block)
    if not m:
        return block

    brace_pos = block.find("{", m.end())
    if brace_pos == -1:
        return block

    header = block[:brace_pos].strip()  # "Mesh Name" or "Mesh"
    body = block[brace_pos:]

    lx = Lexer(body)
    lx.expect("{")

    # ---- Vertices ----
    nverts = lx.read_int()
    lx.expect(";")

    verts = []
    for vi in range(nverts):
        x = lx.read_float(); lx.expect(";")
        y = lx.read_float(); lx.expect(";")
        z = lx.read_float(); lx.expect(";")

        if axis == "x":
            x = -x
        elif axis == "y":
            y = -y
        elif axis == "z":
            z = -z

        verts.append((x, y, z))

        if vi < nverts - 1:
            lx.skip_ws_comments()
            if lx.peek() == ",":
                lx.i += 1

    lx.expect(";")  # end of vertex list

    # ---- Faces ----
    nfaces = lx.read_int()
    lx.expect(";")

    faces = []
    for fi in range(nfaces):
        vcount = lx.read_int()
        lx.expect(";")

        idx = []
        for k in range(vcount):
            idx.append(lx.read_int())
            if k < vcount - 1:
                lx.expect(",")

        lx.expect(";")
        faces.append(flip_polygon(idx))

        lx.skip_ws_comments()
        if fi < nfaces - 1 and lx.peek() == ",":
            lx.i += 1

    lx.expect(";")  # end face list

    # ---- Child chunks ----
    children_out = []

    while True:
        lx.skip_ws_comments()
        if lx.peek() == "}":
            lx.i += 1
            break

        word = lx.read_word()
        if word is None:
            # consume something to avoid infinite loop
            lx.i += 1
            continue

        if word == "MeshNormals":
            # optional name
            lx.skip_ws_comments()
            name = None
            if lx.peek() != "{":
                name = lx.read_word()
                lx.skip_ws_comments()

            lx.expect("{")

            nn = lx.read_int(); lx.expect(";")
            normals = []
            for ni in range(nn):
                nx = lx.read_float(); lx.expect(";")
                ny = lx.read_float(); lx.expect(";")
                nz = lx.read_float(); lx.expect(";")

                if axis == "x":
                    nx = -nx
                elif axis == "y":
                    ny = -ny
                elif axis == "z":
                    nz = -nz

                normals.append((nx, ny, nz))

                if ni < nn - 1:
                    lx.skip_ws_comments()
                    if lx.peek() == ",":
                        lx.i += 1

            lx.expect(";")

            nfn = lx.read_int(); lx.expect(";")
            fnfaces = []
            for fi2 in range(nfn):
                c = lx.read_int(); lx.expect(";")
                fidx = []
                for k in range(c):
                    fidx.append(lx.read_int())
                    if k < c - 1:
                        lx.expect(",")
                lx.expect(";")

                fnfaces.append(flip_polygon(fidx))

                lx.skip_ws_comments()
                if fi2 < nfn - 1 and lx.peek() == ",":
                    lx.i += 1

            lx.expect(";")

            # close MeshNormals
            lx.skip_ws_comments()
            lx.expect("}")

            # Rebuild MeshNormals chunk
            nm_header = f"MeshNormals{' ' + name if name else ''} {{\n"
            nm = [nm_header]
            nm.append(f" {nn};\n")
            for i, (nx, ny, nz) in enumerate(normals):
                sep = "," if i < nn - 1 else ";"
                nm.append(f" {nx:.6f};{ny:.6f};{nz:.6f};{sep}\n")
            nm.append(f" {nfn};\n")
            for i, idx in enumerate(fnfaces):
                sep = "," if i < nfn - 1 else ";"
                nm.append(f" {len(idx)};" + ",".join(str(v) for v in idx) + f";{sep}\n")
            nm.append("}\n")

            children_out.append("".join(nm))
            continue

        # Generic: capture raw brace-block chunks (materials, vertex colors, etc.)
        lx.skip_ws_comments()
        if lx.peek() == "{":
            # capture from '{' to matching '}'
            bstart = lx.i
            depth = 0
            while lx.i < lx.n:
                ch = lx.s[lx.i]
                if ch == "{":
                    depth += 1
                elif ch == "}":
                    depth -= 1
                    if depth == 0:
                        lx.i += 1
                        break
                lx.i += 1

            raw = lx.s[bstart:lx.i]
            children_out.append(f"{word} {raw}\n")
        else:
            # statement until ';'
            stmt = [word]
            while lx.i < lx.n:
                ch = lx.s[lx.i]
                stmt.append(ch)
                lx.i += 1
                if ch == ";":
                    break
            children_out.append("".join(stmt) + "\n")

    # ---- Rebuild Mesh ----
    out = []
    out.append(f"{header} {{\n")
    out.append(f" {nverts};\n")
    for i, (x, y, z) in enumerate(verts):
        sep = "," if i < nverts - 1 else ";"
        out.append(f" {x:.6f};{y:.6f};{z:.6f};{sep}\n")

    out.append(f" {nfaces};\n")
    for i, idx in enumerate(faces):
        sep = "," if i < nfaces - 1 else ";"
        out.append(f" {len(idx)};" + ",".join(str(v) for v in idx) + f";{sep}\n")

    out.append("".join(children_out))
    out.append("}\n")
    return "".join(out)


def mirror_x_text(full_text: str, axis: str) -> str:
    # Only transform real Mesh objects (not "template Mesh { ... }")
    mesh_starts = list(re.finditer(r"(?m)^\s*Mesh\b", full_text))

    parts = []
    pos = 0

    for m in mesh_starts:
        start = m.start()

        # Skip template lines like "template Mesh {"
        line_start = full_text.rfind("\n", 0, start) + 1
        line_end = full_text.find("\n", start)
        line = full_text[line_start:line_end if line_end != -1 else len(full_text)]
        if "template" in line:
            continue

        parts.append(full_text[pos:start])

        block, endpos = extract_brace_block(full_text, start)
        parts.append(process_mesh_block(block, axis=axis))

        pos = endpos

    parts.append(full_text[pos:])
    return "".join(parts)


def main():
    in_path = Path(IN_PATH)
    out_path = Path(OUT_PATH)

    raw = in_path.read_text(encoding="latin-1")  # keep bytes stable
    if not raw.lstrip().startswith("xof"):
        raise SystemExit("Input does not look like a text .x file (expected 'xof ...txt...').")

    mirrored = mirror_x_text(raw, axis=MIRROR_AXIS)
    out_path.write_text(mirrored, encoding="latin-1")

    print(f"Done.\nInput : {in_path}\nOutput: {out_path}\nAxis  : {MIRROR_AXIS}")


if __name__ == "__main__":
    main()