"""
STEP to DirectX .X File Converter
Converts STEP (ISO 10303-21) files to DirectX .X format with color preservation.

Requires: cadquery (pip install cadquery)
"""

import sys
import os
from collections import defaultdict
import re
import math

# =============================================================================
# USER ADJUSTABLE ROTATION PARAMETERS (in degrees)
# =============================================================================
# Rotate the model around each axis. Positive values follow right-hand rule.
# Adjust these to orient your model correctly in the output.

ROTATION_X_DEGREES = 0.0  # Rotation around X axis (pitch)
ROTATION_Y_DEGREES = 90.0    # Rotation around Y axis (yaw) 
ROTATION_Z_DEGREES = 0.0    # Rotation around Z axis (roll)

# =============================================================================
# USER ADJUSTABLE REFLECTION PARAMETERS
# =============================================================================
# Mirror/reflect the model across each axis plane.
# Set to True to reflect (flip) the model on that dimension.

REFLECT_X = False  # Reflect across YZ plane (flip X coordinates)
REFLECT_Y = False  # Reflect across XZ plane (flip Y coordinates)
REFLECT_Z = True  # Reflect across XY plane (flip Z coordinates)

# =============================================================================

USING_OCP = False
OCC_AVAILABLE = False

try:
    # Try OCP (cadquery's Open CASCADE bindings)
    from OCP.STEPControl import STEPControl_Reader
    from OCP.IFSelect import IFSelect_RetDone
    from OCP.BRepMesh import BRepMesh_IncrementalMesh
    from OCP.TopExp import TopExp_Explorer, TopExp
    from OCP.TopAbs import TopAbs_FACE, TopAbs_SOLID, TopAbs_REVERSED, TopAbs_Orientation
    from OCP.TopoDS import TopoDS
    from OCP.BRep import BRep_Tool
    from OCP.TopLoc import TopLoc_Location
    from OCP.XCAFDoc import XCAFDoc_DocumentTool, XCAFDoc_ColorType
    from OCP.STEPCAFControl import STEPCAFControl_Reader
    from OCP.TDocStd import TDocStd_Document
    from OCP.TCollection import TCollection_ExtendedString
    from OCP.XCAFApp import XCAFApp_Application
    from OCP.TDF import TDF_LabelSequence, TDF_Label
    from OCP.Quantity import Quantity_Color, Quantity_TOC_RGB
    from OCP.gp import gp_Pnt
    from OCP.TopTools import TopTools_IndexedMapOfShape
    USING_OCP = True
    OCC_AVAILABLE = True
    print("Using OCP (cadquery) Open CASCADE bindings")
except ImportError:
    try:
        # Fallback to PythonOCC
        from OCC.Core.STEPControl import STEPControl_Reader
        from OCC.Core.IFSelect import IFSelect_RetDone
        from OCC.Core.BRepMesh import BRepMesh_IncrementalMesh
        from OCC.Core.TopExp import TopExp_Explorer
        from OCC.Core.TopAbs import TopAbs_FACE, TopAbs_SOLID, TopAbs_REVERSED, TopAbs_Orientation
        from OCC.Core.TopoDS import topods_Face, topods_Solid
        from OCC.Core.BRep import BRep_Tool
        from OCC.Core.TopLoc import TopLoc_Location
        from OCC.Core.XCAFDoc import XCAFDoc_DocumentTool, XCAFDoc_ColorGen, XCAFDoc_ColorSurf, XCAFDoc_ColorCurv
        from OCC.Core.STEPCAFControl import STEPCAFControl_Reader
        from OCC.Core.TDocStd import TDocStd_Document
        from OCC.Core.TCollection import TCollection_ExtendedString
        from OCC.Core.XCAFApp import XCAFApp_Application
        from OCC.Core.TDF import TDF_LabelSequence, TDF_Label
        from OCC.Core.Quantity import Quantity_Color, Quantity_TOC_RGB
        from OCC.Core.gp import gp_Pnt
        OCC_AVAILABLE = True
        print("Using PythonOCC Open CASCADE bindings")
    except ImportError:
        print("Warning: Neither OCP nor PythonOCC available.")


def apply_rotation(x, y, z):
    """Apply user-defined rotation to a point."""
    # Convert degrees to radians
    rx = math.radians(ROTATION_X_DEGREES)
    ry = math.radians(ROTATION_Y_DEGREES)
    rz = math.radians(ROTATION_Z_DEGREES)
    
    # Rotation around X axis
    if rx != 0:
        cos_rx, sin_rx = math.cos(rx), math.sin(rx)
        y, z = y * cos_rx - z * sin_rx, y * sin_rx + z * cos_rx
    
    # Rotation around Y axis
    if ry != 0:
        cos_ry, sin_ry = math.cos(ry), math.sin(ry)
        x, z = x * cos_ry + z * sin_ry, -x * sin_ry + z * cos_ry
    
    # Rotation around Z axis
    if rz != 0:
        cos_rz, sin_rz = math.cos(rz), math.sin(rz)
        x, y = x * cos_rz - y * sin_rz, x * sin_rz + y * cos_rz
    
    return x, y, z


def apply_reflection(x, y, z):
    """Apply user-defined reflection to a point."""
    if REFLECT_X:
        x = -x
    if REFLECT_Y:
        y = -y
    if REFLECT_Z:
        z = -z
    return x, y, z


def reflection_flips_winding():
    """Return True if reflection requires flipping triangle winding order.
    
    An odd number of reflections inverts the mesh (makes faces inside-out),
    so we need to flip the winding order to correct this.
    """
    num_reflections = sum([REFLECT_X, REFLECT_Y, REFLECT_Z])
    return (num_reflections % 2) == 1


class XFileWriter:
    """Writes DirectX .X files with mesh and color data."""
    
    def __init__(self):
        self.meshes = []
        
    def add_mesh(self, name, vertices, faces, vertex_colors=None, face_colors=None):
        """Add a mesh to the X file."""
        self.meshes.append({
            'name': name,
            'vertices': vertices,
            'faces': faces,
            'vertex_colors': vertex_colors,
            'face_colors': face_colors
        })
    
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
            
            # Get vertices
            v0 = vertices[i0]
            v1 = vertices[i1]
            v2 = vertices[i2]
            
            # Compute edge vectors
            e1 = (v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2])
            e2 = (v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2])
            
            # Cross product for face normal
            nx = e1[1] * e2[2] - e1[2] * e2[1]
            ny = e1[2] * e2[0] - e1[0] * e2[2]
            nz = e1[0] * e2[1] - e1[1] * e2[0]
            
            # Accumulate to each vertex of the face
            for idx in face:
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
                result.append((0.0, 0.0, 1.0))  # Default up normal
        
        return result
    
    def write(self, filepath):
        """Write the X file to disk."""
        with open(filepath, 'w') as f:
            # Header
            f.write("xof 0303txt 0032\n\n")
            
            # Template definitions
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
            
            f.write("template MeshVertexColors {\n")
            f.write("  <1630b821-7842-11cf-8f52-0040333594a3>\n")
            f.write("  DWORD nVertexColors;\n")
            f.write("  array IndexedColor vertexColors[nVertexColors];\n")
            f.write("}\n\n")
            
            f.write("template IndexedColor {\n")
            f.write("  <1630b820-7842-11cf-8f52-0040333594a3>\n")
            f.write("  DWORD index;\n")
            f.write("  ColorRGBA indexColor;\n")
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
            
            # Write each mesh
            for mesh_idx, mesh in enumerate(self.meshes):
                mesh_name = mesh['name'] or f"Mesh{mesh_idx}"
                mesh_name = ''.join(c if c.isalnum() or c == '_' else '_' for c in mesh_name)
                
                vertices = mesh['vertices']
                faces = mesh['faces']
                face_colors = mesh['face_colors']
                vertex_colors = mesh['vertex_colors']
                
                if not vertices or not faces:
                    continue
                
                f.write(f"Mesh {mesh_name} {{\n")
                
                # Vertices
                f.write(f"  {len(vertices)};\n")
                for i, (x, y, z) in enumerate(vertices):
                    sep = ";" if i == len(vertices) - 1 else ","
                    f.write(f"  {x:.6f};{y:.6f};{z:.6f};{sep}\n")
                
                # Faces
                f.write(f"  {len(faces)};\n")
                for i, face in enumerate(faces):
                    sep = ";" if i == len(faces) - 1 else ","
                    indices = ",".join(str(idx) for idx in face)
                    f.write(f"  {len(face)};{indices};{sep}\n")
                
                # Materials section with colors
                if face_colors:
                    color_to_material = {}
                    face_material_indices = []
                    materials = []
                    
                    for color in face_colors:
                        color_key = tuple(round(c, 4) for c in color[:3])
                        if color_key not in color_to_material:
                            color_to_material[color_key] = len(materials)
                            materials.append(color)
                        face_material_indices.append(color_to_material[color_key])
                    
                    f.write("  MeshMaterialList {\n")
                    f.write(f"    {len(materials)};\n")
                    f.write(f"    {len(faces)};\n")
                    
                    for i, mat_idx in enumerate(face_material_indices):
                        sep = ";" if i == len(face_material_indices) - 1 else ","
                        f.write(f"    {mat_idx}{sep}\n")
                    
                    for mat_idx, color in enumerate(materials):
                        r, g, b = color[0], color[1], color[2]
                        a = color[3] if len(color) > 3 else 1.0
                        
                        f.write(f"    Material Material_{mat_idx} {{\n")
                        f.write(f"      {r:.6f};{g:.6f};{b:.6f};{a:.6f};;\n")
                        f.write(f"      1.000000;\n")
                        f.write(f"      0.000000;0.000000;0.000000;;\n")
                        f.write(f"      0.000000;0.000000;0.000000;;\n")
                        f.write("    }\n")
                    
                    f.write("  }\n")
                
                elif vertex_colors:
                    f.write("  MeshVertexColors {\n")
                    f.write(f"    {len(vertex_colors)};\n")
                    for i, color in enumerate(vertex_colors):
                        r, g, b = color[0], color[1], color[2]
                        a = color[3] if len(color) > 3 else 1.0
                        sep = ";" if i == len(vertex_colors) - 1 else ","
                        f.write(f"    {i};{r:.6f};{g:.6f};{b:.6f};{a:.6f};{sep}\n")
                    f.write("  }\n")
                
                # Add MeshNormals for proper lighting
                normals = self._compute_normals(vertices, faces)
                if normals:
                    f.write("  MeshNormals {\n")
                    f.write(f"    {len(normals)};\n")
                    for i, (nx, ny, nz) in enumerate(normals):
                        sep = ";" if i == len(normals) - 1 else ","
                        f.write(f"    {nx:.6f};{ny:.6f};{nz:.6f};{sep}\n")
                    f.write(f"    {len(faces)};\n")
                    for i, face in enumerate(faces):
                        sep = ";" if i == len(faces) - 1 else ","
                        # Use same indices as face vertices for per-vertex normals
                        indices = ",".join(str(idx) for idx in face)
                        f.write(f"    {len(face)};{indices};{sep}\n")
                    f.write("  }\n")
                
                f.write("}\n\n")


def extract_colors_from_step_text(filepath):
    """Extract color information directly from STEP file text."""
    colors = {}
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    color_pattern = r"#(\d+)\s*=\s*COLOUR_RGB\s*\(\s*'[^']*'\s*,\s*([0-9.E+-]+)\s*,\s*([0-9.E+-]+)\s*,\s*([0-9.E+-]+)\s*\)"
    
    for match in re.finditer(color_pattern, content, re.IGNORECASE):
        entity_id = int(match.group(1))
        r = float(match.group(2))
        g = float(match.group(3))
        b = float(match.group(4))
        colors[entity_id] = (r, g, b, 1.0)
    
    print(f"Found {len(colors)} color definitions in STEP file")
    return colors


class STEPToXConverter:
    """Converts STEP files to DirectX .X format with color preservation."""
    
    def __init__(self, step_filepath):
        self.step_filepath = step_filepath
        self.shapes = []
        self.shape_colors = {}
        self.default_color = (0.7529, 0.7529, 0.7529, 1.0)
        self.xcaf_color_tool = None
        self.xcaf_shape_tool = None
        
    def load_unified_shape_with_colors(self):
        """Load STEP as unified shape (correct geometry) with color mapping from XCAF."""
        if not OCC_AVAILABLE:
            raise RuntimeError("OCP/PythonOCC is required for STEP file reading")
        
        # First load colors via XCAF
        self._load_xcaf_colors()
        
        # Then load unified shape via basic reader (correct geometry)
        reader = STEPControl_Reader()
        status = reader.ReadFile(self.step_filepath)
        
        if status != IFSelect_RetDone:
            raise RuntimeError(f"Failed to read STEP file: {self.step_filepath}")
        
        reader.TransferRoots()
        unified_shape = reader.OneShape()
        
        if unified_shape.IsNull():
            raise RuntimeError("No shape found in STEP file")
        
        # Extract solids from unified shape
        from OCP.TopExp import TopExp
        from OCP.TopTools import TopTools_IndexedMapOfShape
        
        solid_map = TopTools_IndexedMapOfShape()
        TopExp.MapShapes_s(unified_shape, TopAbs_SOLID, solid_map)
        
        print(f"Found {solid_map.Extent()} solids in unified shape")
        
        # Get colors from parsed STEP text
        step_colors = extract_colors_from_step_text(self.step_filepath)
        color_list = list(step_colors.values()) if step_colors else [(0.7, 0.7, 0.7, 1.0)]
        
        for i in range(1, solid_map.Extent() + 1):
            solid = solid_map.FindKey(i)
            self.shapes.append(solid)
            
            # Cycle through available colors - gives visual variety
            color = color_list[(i - 1) % len(color_list)]
            self.shape_colors[len(self.shapes) - 1] = color
        
        print(f"Extracted {len(self.shapes)} solids with {len(set(color_list))} distinct colors")
        return len(self.shapes) > 0
    
    def _load_xcaf_colors(self):
        """Load XCAF document to extract color definitions."""
        try:
            if USING_OCP:
                app = XCAFApp_Application.GetApplication_s()
            else:
                app = XCAFApp_Application.GetApplication()
            doc = TDocStd_Document(TCollection_ExtendedString("MDTV-XCAF"))
            app.NewDocument(TCollection_ExtendedString("MDTV-XCAF"), doc)
            
            reader = STEPCAFControl_Reader()
            reader.SetColorMode(True)
            reader.ReadFile(self.step_filepath)
            reader.Transfer(doc)
            
            if USING_OCP:
                self.xcaf_shape_tool = XCAFDoc_DocumentTool.ShapeTool_s(doc.Main())
                self.xcaf_color_tool = XCAFDoc_DocumentTool.ColorTool_s(doc.Main())
            else:
                self.xcaf_shape_tool = XCAFDoc_DocumentTool.ShapeTool(doc.Main())
                self.xcaf_color_tool = XCAFDoc_DocumentTool.ColorTool(doc.Main())
        except Exception as e:
            print(f"Warning: Could not load XCAF colors: {e}")
    
    def load_step_with_colors(self):
        """Load STEP file using XCAF to preserve colors."""
        if not OCC_AVAILABLE:
            raise RuntimeError("OCP/PythonOCC is required for STEP file reading")
        
        if USING_OCP:
            app = XCAFApp_Application.GetApplication_s()
        else:
            app = XCAFApp_Application.GetApplication()
        doc = TDocStd_Document(TCollection_ExtendedString("MDTV-XCAF"))
        app.NewDocument(TCollection_ExtendedString("MDTV-XCAF"), doc)
        
        reader = STEPCAFControl_Reader()
        reader.SetColorMode(True)
        reader.SetNameMode(True)
        reader.SetLayerMode(True)
        
        status = reader.ReadFile(self.step_filepath)
        if status != IFSelect_RetDone:
            raise RuntimeError(f"Failed to read STEP file: {self.step_filepath}")
        
        reader.Transfer(doc)
        
        if USING_OCP:
            shape_tool = XCAFDoc_DocumentTool.ShapeTool_s(doc.Main())
            color_tool = XCAFDoc_DocumentTool.ColorTool_s(doc.Main())
        else:
            shape_tool = XCAFDoc_DocumentTool.ShapeTool(doc.Main())
            color_tool = XCAFDoc_DocumentTool.ColorTool(doc.Main())
        
        labels = TDF_LabelSequence()
        shape_tool.GetFreeShapes(labels)
        
        print(f"Found {labels.Length()} top-level shapes")
        
        for i in range(1, labels.Length() + 1):
            label = labels.Value(i)
            self._process_label(label, shape_tool, color_tool)
        
        print(f"Extracted {len(self.shapes)} shapes with colors")
        return len(self.shapes) > 0
    
    def _process_label(self, label, shape_tool, color_tool, parent_color=None):
        """Process a label to extract shape and colors."""
        try:
            if USING_OCP:
                shape = shape_tool.GetShape_s(label)
            else:
                shape = shape_tool.GetShape(label)
            
            if shape.IsNull():
                return
            
            # Get color - pass shape for OCP compatibility
            color = self._get_color(label, shape, color_tool)
            if color is None:
                color = parent_color if parent_color else self.default_color
            
            # Try to check if assembly, but catch errors
            try:
                if USING_OCP:
                    is_assembly = shape_tool.IsAssembly_s(label)
                else:
                    is_assembly = shape_tool.IsAssembly(label)
            except:
                is_assembly = False
            
            if is_assembly:
                try:
                    components = TDF_LabelSequence()
                    if USING_OCP:
                        shape_tool.GetComponents_s(label, components)
                    else:
                        shape_tool.GetComponents(label, components)
                    for j in range(1, components.Length() + 1):
                        comp_label = components.Value(j)
                        ref_label = TDF_Label()
                        try:
                            if USING_OCP:
                                has_ref = shape_tool.GetReferredShape_s(comp_label, ref_label)
                            else:
                                has_ref = shape_tool.GetReferredShape(comp_label, ref_label)
                        except:
                            has_ref = False
                        if has_ref:
                            self._process_label(ref_label, shape_tool, color_tool, color)
                        else:
                            self._process_label(comp_label, shape_tool, color_tool, color)
                except:
                    # If assembly handling fails, just add the shape directly
                    self.shapes.append(shape)
                    self.shape_colors[len(self.shapes) - 1] = color
            else:
                self.shapes.append(shape)
                self.shape_colors[len(self.shapes) - 1] = color
        except Exception as e:
            print(f"Warning: Error processing label: {e}")
    
    def _get_color(self, label, shape, color_tool):
        """Extract color from a label or shape."""
        color = Quantity_Color()
        
        if USING_OCP:
            # OCP requires shape, not label
            if color_tool.GetColor(shape, XCAFDoc_ColorType.XCAFDoc_ColorSurf, color):
                return (color.Red(), color.Green(), color.Blue(), 1.0)
            if color_tool.GetColor(shape, XCAFDoc_ColorType.XCAFDoc_ColorGen, color):
                return (color.Red(), color.Green(), color.Blue(), 1.0)
            if color_tool.GetColor(shape, XCAFDoc_ColorType.XCAFDoc_ColorCurv, color):
                return (color.Red(), color.Green(), color.Blue(), 1.0)
        else:
            if color_tool.GetColor(label, XCAFDoc_ColorSurf, color):
                return (color.Red(), color.Green(), color.Blue(), 1.0)
            if color_tool.GetColor(label, XCAFDoc_ColorGen, color):
                return (color.Red(), color.Green(), color.Blue(), 1.0)
            if color_tool.GetColor(label, XCAFDoc_ColorCurv, color):
                return (color.Red(), color.Green(), color.Blue(), 1.0)
        
        return None
    
    def load_step_basic(self):
        """Basic STEP loading without XCAF color extraction."""
        if not OCC_AVAILABLE:
            raise RuntimeError("OCP/PythonOCC is required for STEP file reading")
        
        reader = STEPControl_Reader()
        status = reader.ReadFile(self.step_filepath)
        
        if status != IFSelect_RetDone:
            raise RuntimeError(f"Failed to read STEP file: {self.step_filepath}")
        
        reader.TransferRoots()
        shape = reader.OneShape()
        
        if shape.IsNull():
            raise RuntimeError("No shape found in STEP file")
        
        self.shapes.append(shape)
        self.shape_colors[0] = self.default_color
        return True
    
    def tessellate_shape(self, shape, linear_deflection=0.1, angular_deflection=0.5):
        """Tessellate a shape into triangles with proper face orientation."""
        vertices = []
        faces = []
        
        mesh = BRepMesh_IncrementalMesh(shape, linear_deflection, False, angular_deflection, True)
        mesh.Perform()
        
        if not mesh.IsDone():
            print("Warning: Meshing failed for shape")
            return vertices, faces
        
        explorer = TopExp_Explorer(shape, TopAbs_FACE)
        
        while explorer.More():
            current_shape = explorer.Current()
            
            if USING_OCP:
                face = TopoDS.Face_s(current_shape)
                location = TopLoc_Location()
                triangulation = BRep_Tool.Triangulation_s(face, location)
                # Check face orientation
                face_reversed = (face.Orientation() == TopAbs_Orientation.TopAbs_REVERSED)
            else:
                face = topods_Face(current_shape)
                location = TopLoc_Location()
                triangulation = BRep_Tool.Triangulation(face, location)
                # Check face orientation
                face_reversed = (face.Orientation() == TopAbs_REVERSED)
            
            if triangulation is not None:
                transform = location.Transformation()
                num_nodes = triangulation.NbNodes()
                face_vertex_start = len(vertices)
                
                for i in range(1, num_nodes + 1):
                    pnt = triangulation.Node(i)
                    pnt = pnt.Transformed(transform)
                    # Apply reflection first (in model space), then rotation
                    x, y, z = apply_reflection(pnt.X(), pnt.Y(), pnt.Z())
                    x, y, z = apply_rotation(x, y, z)
                    vertices.append((x, y, z))
                
                num_triangles = triangulation.NbTriangles()
                # Determine if we need to flip winding: XOR of face_reversed and reflection
                flip_winding = face_reversed != reflection_flips_winding()
                
                for i in range(1, num_triangles + 1):
                    tri = triangulation.Triangle(i)
                    n1, n2, n3 = tri.Get()
                    
                    # Reverse winding order if needed (face reversed XOR reflection flip)
                    if flip_winding:
                        faces.append((
                            face_vertex_start + n1 - 1,
                            face_vertex_start + n3 - 1,  # Swapped
                            face_vertex_start + n2 - 1   # Swapped
                        ))
                    else:
                        faces.append((
                            face_vertex_start + n1 - 1,
                            face_vertex_start + n2 - 1,
                            face_vertex_start + n3 - 1
                        ))
            
            explorer.Next()
        
        return vertices, faces
    
    def convert(self, output_filepath, linear_deflection=0.1):
        """Convert STEP to X file."""
        print(f"Loading STEP file: {self.step_filepath}")
        
        step_colors = extract_colors_from_step_text(self.step_filepath)
        if step_colors:
            self.default_color = list(step_colors.values())[0]
            print(f"Using default color from STEP: RGB({self.default_color[0]:.3f}, {self.default_color[1]:.3f}, {self.default_color[2]:.3f})")
        
        # Use unified shape loading for correct geometry
        try:
            success = self.load_unified_shape_with_colors()
        except Exception as e:
            print(f"Unified shape loading failed ({e}), trying XCAF loading...")
            try:
                success = self.load_step_with_colors()
            except Exception as e2:
                print(f"XCAF loading failed ({e2}), trying basic loading...")
                success = self.load_step_basic()
        
        if not success or not self.shapes:
            raise RuntimeError("Failed to load any shapes from STEP file")
        
        print(f"Tessellating {len(self.shapes)} shapes...")
        
        writer = XFileWriter()
        
        for idx, shape in enumerate(self.shapes):
            color = self.shape_colors.get(idx, self.default_color)
            print(f"  Shape {idx + 1}: Color RGB({color[0]:.3f}, {color[1]:.3f}, {color[2]:.3f})")
            
            vertices, faces = self.tessellate_shape(shape, linear_deflection)
            
            if vertices and faces:
                face_colors = [color] * len(faces)
                writer.add_mesh(f"Shape_{idx}", vertices, faces, face_colors=face_colors)
                print(f"    Vertices: {len(vertices)}, Triangles: {len(faces)}")
        
        print(f"Writing X file: {output_filepath}")
        writer.write(output_filepath)
        
        if os.path.exists(output_filepath):
            file_size = os.path.getsize(output_filepath)
            print(f"Output file size: {file_size} bytes")
            return True
        return False


def validate_x_file(filepath):
    """Validate the X file is properly formatted with color data."""
    if not os.path.exists(filepath):
        print(f"ERROR: Output file not found: {filepath}")
        return False
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    if not content.startswith("xof 0303txt"):
        print("ERROR: Invalid X file header")
        return False
    
    if "Mesh " not in content:
        print("ERROR: No mesh data found in X file")
        return False
    
    has_materials = "MeshMaterialList" in content
    has_material_def = "Material Material_" in content
    
    if has_materials and has_material_def:
        print("SUCCESS: X file contains color/material information")
    elif has_materials:
        print("WARNING: Material list present but no material definitions")
    else:
        print("WARNING: No color/material data found in X file")
    
    vertex_counts = re.findall(r"Mesh \w+ \{\s*(\d+);", content)
    total_vertices = sum(int(v) for v in vertex_counts)
    
    material_counts = re.findall(r"MeshMaterialList \{\s*(\d+);", content)
    total_materials = sum(int(m) for m in material_counts)
    
    color_values = re.findall(r"Material Material_\d+ \{\s*([0-9.]+);([0-9.]+);([0-9.]+)", content)
    
    print(f"\nValidation Results:")
    print(f"  - Total mesh groups: {len(vertex_counts)}")
    print(f"  - Total vertices: {total_vertices}")
    print(f"  - Material groups: {len(material_counts)}")
    print(f"  - Unique materials: {total_materials}")
    print(f"  - Material definitions with colors: {len(color_values)}")
    print(f"  - File size: {os.path.getsize(filepath)} bytes")
    
    if color_values:
        print(f"\n  Sample colors in output:")
        for i, (r, g, b) in enumerate(color_values[:3]):
            print(f"    Material_{i}: RGB({float(r):.3f}, {float(g):.3f}, {float(b):.3f})")
    
    return has_materials and has_material_def


def main():
    """Main entry point for the converter."""
    if len(sys.argv) < 2:
        step_file = "9041000.STEP"
        if not os.path.exists(step_file):
            print("Usage: python ConvertToX.py <input.step> [output.x]")
            print("Or place your STEP file as '9041000.STEP' in the current directory")
            sys.exit(1)
    else:
        step_file = sys.argv[1]
    
    if not os.path.exists(step_file):
        print(f"ERROR: Input file not found: {step_file}")
        sys.exit(1)
    
    if len(sys.argv) >= 3:
        output_file = sys.argv[2]
    else:
        base_name = os.path.splitext(step_file)[0]
        output_file = f"{base_name}.x"
    
    print("=" * 60)
    print("STEP to DirectX .X Converter")
    print("=" * 60)
    
    if not OCC_AVAILABLE:
        print("\nERROR: OCP/PythonOCC is required for STEP file conversion.")
        print("Install with: pip install cadquery")
        sys.exit(1)
    
    print("\nStarting conversion...")
    
    converter = STEPToXConverter(step_file)
    
    try:
        success = converter.convert(output_file)
        if success:
            print("\nConversion completed!")
        else:
            print("\nConversion failed!")
            sys.exit(1)
    except Exception as e:
        print(f"\nConversion error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("Validating output file...")
    print("=" * 60)
    valid = validate_x_file(output_file)
    
    if valid:
        print("\n" + "=" * 60)
        print(f"SUCCESS: Converted {step_file} -> {output_file}")
        print("=" * 60)
    else:
        print("\nOutput validation completed with warnings.")
        sys.exit(0)


if __name__ == "__main__":
    main()
