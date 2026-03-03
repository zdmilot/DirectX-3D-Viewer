"""
DirectX .X File Merger
Combines two .X files by placing the second object next to the first
with configurable face placement and spacing.

Usage: python x_file_merger.py <input1.x> <input2.x> [output.x]
"""

import sys
import os
import re

# =============================================================================
# USER ADJUSTABLE PARAMETERS
# =============================================================================

# Default spacing between objects (in model units)
DEFAULT_SPACING = 1.0

# Face placement options:
# "right"  - Place object 2 to the right of object 1 (+X direction)
# "left"   - Place object 2 to the left of object 1 (-X direction)
# "front"  - Place object 2 in front of object 1 (+Z direction)
# "back"   - Place object 2 behind object 1 (-Z direction)
# "top"    - Place object 2 above object 1 (+Y direction)
# "bottom" - Place object 2 below object 1 (-Y direction)

# =============================================================================


class XFileMesh:
    """Represents a mesh from an X file."""
    
    def __init__(self, name=""):
        self.name = name
        self.vertices = []
        self.faces = []
        self.materials = []
        self.face_material_indices = []
        self.normals = []
        self.face_normals = []


class XFileParser:
    """Parses DirectX .X files."""
    
    def __init__(self, filepath):
        self.filepath = filepath
        self.meshes = []
        self.content = ""
        
    def parse(self):
        """Parse the X file and extract all meshes."""
        with open(self.filepath, 'r') as f:
            self.content = f.read()
        
        # Find all Mesh blocks
        mesh_pattern = r'Mesh\s+(\w+)\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}'
        
        # Use a more robust approach - find Mesh keywords and parse blocks
        self._parse_meshes()
        
        return self.meshes
    
    def _parse_meshes(self):
        """Parse all mesh blocks from the file."""
        # Find positions of all "Mesh " declarations (not MeshMaterialList, MeshNormals, etc.)
        pos = 0
        while True:
            # Find next Mesh keyword that's not part of another keyword
            match = re.search(r'\bMesh\s+(\w+)\s*\{', self.content[pos:])
            if not match:
                break
            
            start = pos + match.start()
            name = match.group(1)
            
            # Skip if this is a template definition
            if "template Mesh" in self.content[max(0, start-20):start+10]:
                pos = start + len(match.group(0))
                continue
            
            # Find the matching closing brace
            brace_start = pos + match.end() - 1
            block_content, end_pos = self._find_block(brace_start)
            
            if block_content:
                mesh = self._parse_mesh_block(name, block_content)
                if mesh and mesh.vertices:
                    self.meshes.append(mesh)
            
            pos = end_pos if end_pos > pos else pos + len(match.group(0))
    
    def _find_block(self, start):
        """Find content between matching braces starting at position start."""
        if start >= len(self.content) or self.content[start] != '{':
            return None, start
        
        depth = 1
        pos = start + 1
        
        while pos < len(self.content) and depth > 0:
            if self.content[pos] == '{':
                depth += 1
            elif self.content[pos] == '}':
                depth -= 1
            pos += 1
        
        if depth == 0:
            return self.content[start+1:pos-1], pos
        return None, start
    
    def _parse_mesh_block(self, name, content):
        """Parse a single mesh block."""
        mesh = XFileMesh(name)
        
        lines = content.strip().split('\n')
        line_idx = 0
        
        # Parse vertex count
        while line_idx < len(lines):
            line = lines[line_idx].strip()
            if line and not line.startswith('//'):
                match = re.match(r'(\d+)\s*;', line)
                if match:
                    vertex_count = int(match.group(1))
                    line_idx += 1
                    break
            line_idx += 1
        else:
            return None
        
        # Parse vertices
        vertices_parsed = 0
        vertex_buffer = ""
        while vertices_parsed < vertex_count and line_idx < len(lines):
            line = lines[line_idx].strip()
            vertex_buffer += line + " "
            line_idx += 1
            
            # Parse vertices from buffer
            vertex_pattern = r'(-?[\d.eE+-]+)\s*;\s*(-?[\d.eE+-]+)\s*;\s*(-?[\d.eE+-]+)\s*;[,;]?'
            for match in re.finditer(vertex_pattern, vertex_buffer):
                x = float(match.group(1))
                y = float(match.group(2))
                z = float(match.group(3))
                mesh.vertices.append((x, y, z))
                vertices_parsed += 1
                if vertices_parsed >= vertex_count:
                    break
            
            # Clear processed part of buffer
            if vertices_parsed > 0:
                last_match = list(re.finditer(vertex_pattern, vertex_buffer))
                if last_match:
                    vertex_buffer = vertex_buffer[last_match[-1].end():]
        
        # Parse face count
        while line_idx < len(lines):
            line = lines[line_idx].strip()
            if line and not line.startswith('//'):
                match = re.match(r'(\d+)\s*;', line)
                if match:
                    face_count = int(match.group(1))
                    line_idx += 1
                    break
            line_idx += 1
        else:
            return mesh if mesh.vertices else None
        
        # Parse faces
        faces_parsed = 0
        face_buffer = ""
        while faces_parsed < face_count and line_idx < len(lines):
            line = lines[line_idx].strip()
            
            # Stop if we hit a nested block
            if re.match(r'(MeshMaterialList|MeshNormals|MeshVertexColors)\s*\{', line):
                break
            
            face_buffer += line + " "
            line_idx += 1
            
            # Parse faces: count;idx,idx,idx;
            face_pattern = r'(\d+)\s*;([\d,\s]+);[,;]?'
            for match in re.finditer(face_pattern, face_buffer):
                count = int(match.group(1))
                indices_str = match.group(2)
                indices = [int(i.strip()) for i in indices_str.split(',') if i.strip()]
                if len(indices) == count:
                    mesh.faces.append(tuple(indices))
                    faces_parsed += 1
                if faces_parsed >= face_count:
                    break
            
            if faces_parsed > 0:
                last_match = list(re.finditer(face_pattern, face_buffer))
                if last_match:
                    face_buffer = face_buffer[last_match[-1].end():]
        
        # Parse MeshMaterialList if present
        remaining_content = '\n'.join(lines[line_idx:])
        self._parse_materials(mesh, remaining_content)
        
        return mesh
    
    def _parse_materials(self, mesh, content):
        """Parse MeshMaterialList from content."""
        mat_match = re.search(r'MeshMaterialList\s*\{', content)
        if not mat_match:
            return
        
        # Find the material list block
        block_start = content.find('{', mat_match.start())
        block_content, _ = self._find_block_from_string(content, block_start)
        if not block_content:
            return
        
        lines = block_content.strip().split('\n')
        line_idx = 0
        
        # Parse material count
        while line_idx < len(lines):
            line = lines[line_idx].strip()
            if line and not line.startswith('//'):
                match = re.match(r'(\d+)\s*;', line)
                if match:
                    material_count = int(match.group(1))
                    line_idx += 1
                    break
            line_idx += 1
        else:
            return
        
        # Parse face index count
        while line_idx < len(lines):
            line = lines[line_idx].strip()
            if line and not line.startswith('//'):
                match = re.match(r'(\d+)\s*;', line)
                if match:
                    face_index_count = int(match.group(1))
                    line_idx += 1
                    break
            line_idx += 1
        else:
            return
        
        # Parse face material indices
        indices_parsed = 0
        index_buffer = ""
        while indices_parsed < face_index_count and line_idx < len(lines):
            line = lines[line_idx].strip()
            if re.match(r'Material\s+', line):
                break
            index_buffer += line + " "
            line_idx += 1
            
            # Parse indices
            for match in re.finditer(r'(\d+)\s*[,;]', index_buffer):
                mesh.face_material_indices.append(int(match.group(1)))
                indices_parsed += 1
                if indices_parsed >= face_index_count:
                    break
        
        # Parse material definitions
        material_content = '\n'.join(lines[line_idx:])
        material_pattern = r'Material\s+(\w+)\s*\{\s*(-?[\d.eE+-]+)\s*;\s*(-?[\d.eE+-]+)\s*;\s*(-?[\d.eE+-]+)\s*;\s*(-?[\d.eE+-]+)\s*;'
        
        for match in re.finditer(material_pattern, material_content):
            r = float(match.group(2))
            g = float(match.group(3))
            b = float(match.group(4))
            a = float(match.group(5))
            mesh.materials.append((r, g, b, a))
    
    def _find_block_from_string(self, content, start):
        """Find content between matching braces in a string."""
        if start >= len(content) or content[start] != '{':
            return None, start
        
        depth = 1
        pos = start + 1
        
        while pos < len(content) and depth > 0:
            if content[pos] == '{':
                depth += 1
            elif content[pos] == '}':
                depth -= 1
            pos += 1
        
        if depth == 0:
            return content[start+1:pos-1], pos
        return None, start


class BoundingBox:
    """Represents an axis-aligned bounding box."""
    
    def __init__(self, vertices):
        if not vertices:
            self.min_x = self.max_x = 0
            self.min_y = self.max_y = 0
            self.min_z = self.max_z = 0
            return
        
        xs = [v[0] for v in vertices]
        ys = [v[1] for v in vertices]
        zs = [v[2] for v in vertices]
        
        self.min_x, self.max_x = min(xs), max(xs)
        self.min_y, self.max_y = min(ys), max(ys)
        self.min_z, self.max_z = min(zs), max(zs)
    
    @property
    def width(self):
        return self.max_x - self.min_x
    
    @property
    def height(self):
        return self.max_y - self.min_y
    
    @property
    def depth(self):
        return self.max_z - self.min_z
    
    @property
    def center(self):
        return (
            (self.min_x + self.max_x) / 2,
            (self.min_y + self.max_y) / 2,
            (self.min_z + self.max_z) / 2
        )


class XFileMerger:
    """Merges multiple X files into one."""
    
    def __init__(self, spacing=DEFAULT_SPACING):
        self.spacing = spacing
        self.meshes = []
    
    def load_file(self, filepath):
        """Load an X file and return its meshes."""
        parser = XFileParser(filepath)
        return parser.parse()
    
    def get_all_vertices(self, meshes):
        """Get all vertices from a list of meshes."""
        all_vertices = []
        for mesh in meshes:
            all_vertices.extend(mesh.vertices)
        return all_vertices
    
    def calculate_offset(self, bbox1, bbox2, face):
        """Calculate the offset to place object 2 relative to object 1."""
        offset_x, offset_y, offset_z = 0, 0, 0
        
        if face == "right":
            # Place to the right (+X)
            offset_x = bbox1.max_x - bbox2.min_x + self.spacing
        elif face == "left":
            # Place to the left (-X)
            offset_x = bbox1.min_x - bbox2.max_x - self.spacing
        elif face == "front":
            # Place in front (+Z)
            offset_z = bbox1.max_z - bbox2.min_z + self.spacing
        elif face == "back":
            # Place behind (-Z)
            offset_z = bbox1.min_z - bbox2.max_z - self.spacing
        elif face == "top":
            # Place above (+Y)
            offset_y = bbox1.max_y - bbox2.min_y + self.spacing
        elif face == "bottom":
            # Place below (-Y)
            offset_y = bbox1.min_y - bbox2.max_y - self.spacing
        
        return offset_x, offset_y, offset_z
    
    def offset_mesh(self, mesh, offset):
        """Apply an offset to all vertices in a mesh."""
        ox, oy, oz = offset
        new_vertices = [(x + ox, y + oy, z + oz) for x, y, z in mesh.vertices]
        
        new_mesh = XFileMesh(mesh.name)
        new_mesh.vertices = new_vertices
        new_mesh.faces = mesh.faces[:]
        new_mesh.materials = mesh.materials[:]
        new_mesh.face_material_indices = mesh.face_material_indices[:]
        return new_mesh
    
    def merge(self, file1, file2, face, output_file):
        """Merge two X files with specified face placement."""
        print(f"Loading: {file1}")
        meshes1 = self.load_file(file1)
        print(f"  Found {len(meshes1)} mesh(es)")
        
        print(f"Loading: {file2}")
        meshes2 = self.load_file(file2)
        print(f"  Found {len(meshes2)} mesh(es)")
        
        if not meshes1:
            print("ERROR: No meshes found in first file")
            return False
        if not meshes2:
            print("ERROR: No meshes found in second file")
            return False
        
        # Calculate bounding boxes
        all_verts1 = self.get_all_vertices(meshes1)
        all_verts2 = self.get_all_vertices(meshes2)
        
        bbox1 = BoundingBox(all_verts1)
        bbox2 = BoundingBox(all_verts2)
        
        print(f"\nObject 1 bounds: X[{bbox1.min_x:.2f}, {bbox1.max_x:.2f}] "
              f"Y[{bbox1.min_y:.2f}, {bbox1.max_y:.2f}] "
              f"Z[{bbox1.min_z:.2f}, {bbox1.max_z:.2f}]")
        print(f"Object 2 bounds: X[{bbox2.min_x:.2f}, {bbox2.max_x:.2f}] "
              f"Y[{bbox2.min_y:.2f}, {bbox2.max_y:.2f}] "
              f"Z[{bbox2.min_z:.2f}, {bbox2.max_z:.2f}]")
        
        # Calculate offset for object 2
        offset = self.calculate_offset(bbox1, bbox2, face)
        print(f"\nPlacing object 2 on '{face}' face with spacing {self.spacing}")
        print(f"Offset: ({offset[0]:.2f}, {offset[1]:.2f}, {offset[2]:.2f})")
        
        # Offset meshes from file 2
        offset_meshes2 = [self.offset_mesh(m, offset) for m in meshes2]
        
        # Combine all meshes
        combined_meshes = meshes1 + offset_meshes2
        
        # Write output
        print(f"\nWriting combined file: {output_file}")
        self.write_x_file(combined_meshes, output_file)
        
        if os.path.exists(output_file):
            file_size = os.path.getsize(output_file)
            print(f"Output file size: {file_size} bytes")
            return True
        return False
    
    def write_x_file(self, meshes, filepath):
        """Write meshes to an X file."""
        with open(filepath, 'w') as f:
            # Header
            f.write("xof 0303txt 0032\n\n")
            
            # Template definitions
            self._write_templates(f)
            
            # Write each mesh with unique names
            mesh_names = set()
            for mesh_idx, mesh in enumerate(meshes):
                if not mesh.vertices or not mesh.faces:
                    continue
                
                # Generate unique name
                base_name = mesh.name if mesh.name else f"Mesh{mesh_idx}"
                base_name = ''.join(c if c.isalnum() or c == '_' else '_' for c in base_name)
                
                # Ensure unique name
                name = base_name
                counter = 1
                while name in mesh_names:
                    name = f"{base_name}_{counter}"
                    counter += 1
                mesh_names.add(name)
                
                self._write_mesh(f, mesh, name)
    
    def _write_templates(self, f):
        """Write X file template definitions."""
        f.write("template ColorRGBA {\n")
        f.write("  <35ff44e0-6c7c-11cf-8f52-0040333594a3>\n")
        f.write("  FLOAT red;\n")
        f.write("  FLOAT green;\n")
        f.write("  FLOAT blue;\n")
        f.write("  FLOAT alpha;\n")
        f.write("}\n\n")
        
        f.write("template ColorRGB {\n")
        f.write("  <d3e16e81-7835-11cf-8f52-0040333594a3>\n")
        f.write("  FLOAT red;\n")
        f.write("  FLOAT green;\n")
        f.write("  FLOAT blue;\n")
        f.write("}\n\n")
        
        f.write("template Material {\n")
        f.write("  <3d82ab4d-62da-11cf-ab39-0020af71e433>\n")
        f.write("  ColorRGBA faceColor;\n")
        f.write("  FLOAT power;\n")
        f.write("  ColorRGB specularColor;\n")
        f.write("  ColorRGB emissiveColor;\n")
        f.write("  [...]\n")
        f.write("}\n\n")
        
        f.write("template MeshMaterialList {\n")
        f.write("  <f6f23f42-7686-11cf-8f52-0040333594a3>\n")
        f.write("  DWORD nMaterials;\n")
        f.write("  DWORD nFaceIndexes;\n")
        f.write("  array DWORD faceIndexes[nFaceIndexes];\n")
        f.write("  [Material <3d82ab4d-62da-11cf-ab39-0020af71e433>]\n")
        f.write("}\n\n")
        
        f.write("template Mesh {\n")
        f.write("  <3d82ab44-62da-11cf-ab39-0020af71e433>\n")
        f.write("  DWORD nVertices;\n")
        f.write("  array Vector vertices[nVertices];\n")
        f.write("  DWORD nFaces;\n")
        f.write("  array MeshFace faces[nFaces];\n")
        f.write("  [...]\n")
        f.write("}\n\n")
        
        f.write("template MeshFace {\n")
        f.write("  <3d82ab5f-62da-11cf-ab39-0020af71e433>\n")
        f.write("  DWORD nFaceVertexIndices;\n")
        f.write("  array DWORD faceVertexIndices[nFaceVertexIndices];\n")
        f.write("}\n\n")
        
        f.write("template Vector {\n")
        f.write("  <3d82ab5e-62da-11cf-ab39-0020af71e433>\n")
        f.write("  FLOAT x;\n")
        f.write("  FLOAT y;\n")
        f.write("  FLOAT z;\n")
        f.write("}\n\n")
        
        f.write("template MeshNormals {\n")
        f.write("  <f6f23f43-7686-11cf-8f52-0040333594a3>\n")
        f.write("  DWORD nNormals;\n")
        f.write("  array Vector normals[nNormals];\n")
        f.write("  DWORD nFaceNormals;\n")
        f.write("  array MeshFace faceNormals[nFaceNormals];\n")
        f.write("}\n\n")
    
    def _write_mesh(self, f, mesh, name):
        """Write a single mesh to the file."""
        import math
        
        f.write(f"Mesh {name} {{\n")
        
        # Vertices
        f.write(f"  {len(mesh.vertices)};\n")
        for i, (x, y, z) in enumerate(mesh.vertices):
            sep = ";" if i == len(mesh.vertices) - 1 else ","
            f.write(f"  {x:.6f};{y:.6f};{z:.6f};{sep}\n")
        
        # Faces
        f.write(f"  {len(mesh.faces)};\n")
        for i, face in enumerate(mesh.faces):
            sep = ";" if i == len(mesh.faces) - 1 else ","
            indices = ",".join(str(idx) for idx in face)
            f.write(f"  {len(face)};{indices};{sep}\n")
        
        # Materials
        if mesh.materials and mesh.face_material_indices:
            f.write("  MeshMaterialList {\n")
            f.write(f"    {len(mesh.materials)};\n")
            f.write(f"    {len(mesh.face_material_indices)};\n")
            
            for i, mat_idx in enumerate(mesh.face_material_indices):
                sep = ";" if i == len(mesh.face_material_indices) - 1 else ","
                f.write(f"    {mat_idx}{sep}\n")
            
            for mat_idx, color in enumerate(mesh.materials):
                r, g, b = color[0], color[1], color[2]
                a = color[3] if len(color) > 3 else 1.0
                
                f.write(f"    Material Material_{mat_idx} {{\n")
                f.write(f"      {r:.6f};{g:.6f};{b:.6f};{a:.6f};;\n")
                f.write(f"      1.000000;\n")
                f.write(f"      0.000000;0.000000;0.000000;;\n")
                f.write(f"      0.000000;0.000000;0.000000;;\n")
                f.write("    }\n")
            
            f.write("  }\n")
        
        # Normals
        normals = self._compute_normals(mesh.vertices, mesh.faces)
        if normals:
            f.write("  MeshNormals {\n")
            f.write(f"    {len(normals)};\n")
            for i, (nx, ny, nz) in enumerate(normals):
                sep = ";" if i == len(normals) - 1 else ","
                f.write(f"    {nx:.6f};{ny:.6f};{nz:.6f};{sep}\n")
            f.write(f"    {len(mesh.faces)};\n")
            for i, face in enumerate(mesh.faces):
                sep = ";" if i == len(mesh.faces) - 1 else ","
                indices = ",".join(str(idx) for idx in face)
                f.write(f"    {len(face)};{indices};{sep}\n")
            f.write("  }\n")
        
        f.write("}\n\n")
    
    def _compute_normals(self, vertices, faces):
        """Compute per-vertex normals by averaging face normals."""
        import math
        
        if not vertices or not faces:
            return []
        
        # Initialize normals to zero
        normals = [[0.0, 0.0, 0.0] for _ in vertices]
        
        # Compute face normals and accumulate to vertices
        for face in faces:
            if len(face) < 3:
                continue
            
            i0, i1, i2 = face[0], face[1], face[2]
            
            if i0 >= len(vertices) or i1 >= len(vertices) or i2 >= len(vertices):
                continue
            
            v0 = vertices[i0]
            v1 = vertices[i1]
            v2 = vertices[i2]
            
            e1 = (v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2])
            e2 = (v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2])
            
            nx = e1[1] * e2[2] - e1[2] * e2[1]
            ny = e1[2] * e2[0] - e1[0] * e2[2]
            nz = e1[0] * e2[1] - e1[1] * e2[0]
            
            for idx in face:
                if idx < len(normals):
                    normals[idx][0] += nx
                    normals[idx][1] += ny
                    normals[idx][2] += nz
        
        # Normalize all normals
        result = []
        for n in normals:
            length = math.sqrt(n[0]*n[0] + n[1]*n[1] + n[2]*n[2])
            if length > 1e-10:
                result.append((n[0]/length, n[1]/length, n[2]/length))
            else:
                result.append((0.0, 0.0, 1.0))
        
        return result


def print_usage():
    """Print usage information."""
    print("=" * 60)
    print("DirectX .X File Merger")
    print("=" * 60)
    print("\nUsage:")
    print("  python x_file_merger.py <input1.x> <input2.x> [face] [output.x]")
    print("\nFace options (where to place object 2 relative to object 1):")
    print("  right  - Place to the right (+X direction) [default]")
    print("  left   - Place to the left (-X direction)")
    print("  front  - Place in front (+Z direction)")
    print("  back   - Place behind (-Z direction)")
    print("  top    - Place above (+Y direction)")
    print("  bottom - Place below (-Y direction)")
    print(f"\nDefault spacing: {DEFAULT_SPACING} units")
    print("\nExamples:")
    print("  python x_file_merger.py model1.x model2.x")
    print("  python x_file_merger.py model1.x model2.x right")
    print("  python x_file_merger.py model1.x model2.x top output.x")


def main():
    """Main entry point."""
    valid_faces = ["right", "left", "front", "back", "top", "bottom"]
    
    if len(sys.argv) < 3:
        print_usage()
        sys.exit(1)
    
    input1 = sys.argv[1]
    input2 = sys.argv[2]
    
    # Parse optional arguments
    face = "right"  # default
    output = None
    
    for arg in sys.argv[3:]:
        if arg.lower() in valid_faces:
            face = arg.lower()
        elif arg.endswith('.x') or arg.endswith('.X'):
            output = arg
    
    # Default output filename
    if output is None:
        base1 = os.path.splitext(os.path.basename(input1))[0]
        base2 = os.path.splitext(os.path.basename(input2))[0]
        output = f"{base1}_{base2}_merged.x"
    
    # Validate input files
    if not os.path.exists(input1):
        print(f"ERROR: Input file not found: {input1}")
        sys.exit(1)
    if not os.path.exists(input2):
        print(f"ERROR: Input file not found: {input2}")
        sys.exit(1)
    
    print("=" * 60)
    print("DirectX .X File Merger")
    print("=" * 60)
    print(f"\nInput 1: {input1}")
    print(f"Input 2: {input2}")
    print(f"Face: {face}")
    print(f"Spacing: {DEFAULT_SPACING}")
    print(f"Output: {output}")
    print()
    
    merger = XFileMerger(spacing=DEFAULT_SPACING)
    
    try:
        success = merger.merge(input1, input2, face, output)
        if success:
            print("\n" + "=" * 60)
            print("SUCCESS: Files merged successfully!")
            print("=" * 60)
        else:
            print("\nERROR: Merge failed!")
            sys.exit(1)
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
