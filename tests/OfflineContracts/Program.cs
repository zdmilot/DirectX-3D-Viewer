using System.Buffers.Binary;
using System.Diagnostics;
using System.Numerics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using DirectX3DViewer.Core.Conversion;
using DirectX3DViewer.Core.Formats;
using DirectX3DViewer.Core.Geometry;

// Direct reference to the actual standalone Core project. No UI/stub engine.
static class Program
{
    const float Tolerance = 0.00001f;
    static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };
    static readonly List<Dictionary<string, object?>> Records = new();
    static string Revision = "", Output = "", FixtureRoot = "";
    static string? CasePrefix;
    static Dictionary<string, string> Sources = new();
    static readonly string TriangleFixture = "positions=(0,0,0);(2,0,0);(0,3,0); indices=0,1,2; normal=(0,0,1)";
    const string Obj = "mtllib synthetic.mtl\nv 0 0 0\nv 2 0 0\nv 0 3 0\nvt 0 0\nvt 1 0\nvt 0 1\nvn 0 0 1\nusemtl copper\nf -3/-3/-1 -2/-2/-1 -1/-1/-1\n";
    const string Mtl = "newmtl copper\nKd 0.25 0.5 0.75\nKs 0.1 0.2 0.3\nKe 0.02 0.03 0.04\nNs 12\nd 0.6\n";
    const string AsciiStl = "solid triangle\nfacet normal 0 0 1\nouter loop\nvertex 0 0 0\nvertex 2 0 0\nvertex 0 3 0\nendloop\nendfacet\nendsolid triangle\n";
    const string TextX = """
        xof 0303txt 0032
        Mesh triangle {
          3;
          0;0;1;, 2;0;1;, 0;3;1;;
          1; 3;0,1,2;;
          MeshMaterialList {
            1; 1; 0;;
            Material copper {
              0.25;0.5;0.75;0.6;;
              12;
              0.1;0.2;0.3;;
              0.02;0.03;0.04;;
              TextureFilename { "synthetic.png"; }
            }
          }
        }
        """;

    static int Main(string[] args)
    {
        if ((args.Length != 6 && args.Length != 8) || args[0] != "--source-root" || args[2] != "--output" || args[4] != "--revision" || (args.Length == 8 && args[6] != "--case-prefix"))
        {
            Console.Error.WriteLine("Usage: OfflineContracts --source-root REPO --output NEW_JSON --revision SHA [--case-prefix PREFIX]");
            return 2;
        }
        string root = Path.GetFullPath(args[1]);
        Output = Path.GetFullPath(args[3]); Revision = args[5];
        CasePrefix = args.Length == 8 ? args[7] : null;
        if (Revision.Length != 40 || Revision.Any(c => !Uri.IsHexDigit(c))) throw new ArgumentException("A full Git SHA is required.");
        if (File.Exists(Output)) throw new IOException("Refusing to replace previous measured evidence.");
        Directory.CreateDirectory(Path.GetDirectoryName(Output)!);
        FixtureRoot = Path.Combine(Path.GetDirectoryName(Output)!, "synthetic-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(FixtureRoot);
        string core = Path.Combine(root, "Desktop WinUI3 App", "src", "DirectX3DViewer.Core");
        var sourcePaths = Directory.GetFiles(core, "*.cs", SearchOption.AllDirectories)
            .Where(p => !Path.GetRelativePath(core, p).Split(Path.DirectorySeparatorChar).Any(part => part is "obj" or "bin"))
            .Concat(new[] { Path.Combine(core, "DirectX3DViewer.Core.csproj"),
                Path.Combine(root,"tests","OfflineContracts","Program.cs"),
                Path.Combine(root,"tests","OfflineContracts","OfflineContracts.csproj") }).Order().ToArray();
        Sources = sourcePaths.ToDictionary(p => p, p => Hash(File.ReadAllBytes(p)));

        Run("triangle_normals_bounds", "positions=(1,2,3);(5,2,3);(1,8,3); indices=0,1,2",
            new { normals = new[] { 0, 0, 1 }, min = new[] { 1, 2, 3 }, max = new[] { 5, 8, 3 }, center = new[] { 3, 5, 3 }, max_dimension = 6 }, () => {
                var mesh = new MeshData();
                mesh.Positions.AddRange(new[] {new Vector3(1,2,3),new Vector3(5,2,3),new Vector3(1,8,3)});
                mesh.Indices.AddRange(new[] {0,1,2}); mesh.ComputeNormals();
                Check(mesh.TryGetBounds(out var min,out var max), "Mesh bounds absent");
                Near(min,new(1,2,3)); Near(max,new(5,8,3)); Normals(mesh,Vector3.UnitZ);
                var scene = Scene(mesh); Near(scene.Center,new(3,5,3)); Near(scene.MaxDimension,6);
                return new {mesh = Snapshot(mesh), min=Vec(min),max=Vec(max),center=Vec(scene.Center),max_dimension=scene.MaxDimension};
            });
        Run("empty_bounds", "new MeshData(); new SceneModel()", new {bounds=false,min=new[]{0,0,0},max=new[]{0,0,0},max_dimension=0}, () => {
            var mesh = new MeshData(); var scene=Scene(mesh);
            Check(!mesh.TryGetBounds(out var a,out var b),"Empty mesh reported bounds"); Near(a,Vector3.Zero); Near(b,Vector3.Zero);
            Check(!scene.TryGetBounds(out a,out b),"Empty scene reported bounds"); Near(a,Vector3.Zero); Near(b,Vector3.Zero);
            Near(scene.Center,Vector3.Zero); Near(scene.MaxDimension,0);
            return new {mesh_bounds=false,scene_bounds=false,min=Vec(a),max=Vec(b),max_dimension=scene.MaxDimension};
        });
        Run("rotate_z90", TriangleFixture, new {positions=new[]{new[]{0,0,0},new[]{0,2,0},new[]{-3,0,0}},indices=new[]{0,1,2}}, () => {
            var mesh=Triangle(); ModelTransforms.Rotate90(Scene(mesh),Axis.Z,1);
            Positions(mesh,new[]{Vector3.Zero,new Vector3(0,2,0),new Vector3(-3,0,0)});
            Indices(mesh,0,1,2); Normals(mesh,Vector3.UnitZ); return Snapshot(mesh);
        });
        Run("mirror_winding_twice_identity", TriangleFixture, new {first_indices=new[]{0,2,1},second_indices=new[]{0,1,2},twice_identity=true}, () => {
            var mesh=Triangle(); var scene=Scene(mesh); ModelTransforms.Mirror(scene,Axis.X);
            Positions(mesh,new[]{Vector3.Zero,new Vector3(-2,0,0),new Vector3(0,3,0)});
            Indices(mesh,0,2,1); Normals(mesh,Vector3.UnitZ);
            var cross=Vector3.Normalize(Vector3.Cross(mesh.Positions[2]-mesh.Positions[0],mesh.Positions[1]-mesh.Positions[0]));
            Near(cross,Vector3.UnitZ); object first=Snapshot(mesh);
            ModelTransforms.Mirror(scene,Axis.X); TriangleGeometry(mesh); Normals(mesh,Vector3.UnitZ);
            return new {first,second=Snapshot(mesh),twice_identity=true};
        });
        Run("nonuniform_inverse_transpose_normal", "positions=(0,0,0);(1,0,1);(0,1,1); normal=(-1,-1,1)/sqrt(3); scale=(2,3,4)",
            new {normal="(-6,-4,3)/sqrt(61)",positions=new[]{new[]{0,0,0},new[]{2,0,4},new[]{0,3,4}}}, () => {
                var mesh=new MeshData(); mesh.Positions.AddRange(new[]{Vector3.Zero,new Vector3(1,0,1),new Vector3(0,1,1)});
                mesh.Indices.AddRange(new[]{0,1,2}); mesh.ComputeNormals(); mesh.ApplyTransform(Matrix4x4.CreateScale(2,3,4));
                Positions(mesh,new[]{Vector3.Zero,new Vector3(2,0,4),new Vector3(0,3,4)});
                Normals(mesh,new Vector3(-6,-4,3)/MathF.Sqrt(61)); Indices(mesh,0,1,2);
                return Snapshot(mesh);
            });
        Run("literal_text_x_material", TextX, new {vertices=3,triangles=1,z=-1,indices=new[]{0,2,1},diffuse=new[]{.25,.5,.75},opacity=.6,power=12,texture="synthetic.png"}, () => {
            var scene=XFileParser.Parse(Encoding.ASCII.GetBytes(TextX)); var mesh=Single(scene);
            Positions(mesh,new[]{new Vector3(0,0,-1),new Vector3(2,0,-1),new Vector3(0,3,-1)});
            Indices(mesh,0,2,1); Normals(mesh,-Vector3.UnitZ);
            Check(mesh.Materials.Count==1,"Expected one X material"); var material=mesh.Materials[0];
            Material(material); Check(material.TextureFile=="synthetic.png","Texture reference changed");
            Check(mesh.Groups.SequenceEqual(new[]{new MaterialGroup(0,3,0)}),"X material group differs");
            return new {mesh=Snapshot(mesh),material=MaterialSnapshot(material),warnings=scene.Warnings};
        });
        Run("obj_negative_indices_mtl_callback", Obj+"\nCOMPANION\n"+Mtl,
            new {vertices=3,indices=new[]{0,1,2},calls=new[]{"synthetic.mtl"},uvs=new[]{new[]{0,0},new[]{1,0},new[]{0,1}},diffuse=new[]{.25,.5,.75}}, () => {
                var calls=new List<string>();
                var scene=ObjLoader.Parse(Encoding.UTF8.GetBytes(Obj),null,name=>{calls.Add(name);return name=="synthetic.mtl"?Encoding.UTF8.GetBytes(Mtl):null;});
                var mesh=Single(scene); TriangleGeometry(mesh); Normals(mesh,Vector3.UnitZ);
                Check(calls.SequenceEqual(new[]{"synthetic.mtl"}),"Companion callback names/count differs");
                Check(mesh.TexCoords.SequenceEqual(new[]{Vector2.Zero,Vector2.UnitX,Vector2.UnitY}),"OBJ UVs differ");
                Check(mesh.Groups.SequenceEqual(new[]{new MaterialGroup(0,3,1)}),"OBJ material group differs");
                Material(mesh.Materials[1]); Check(scene.Warnings.Count==0,"Unexpected OBJ warning");
                return new {mesh=Snapshot(mesh),calls,material=MaterialSnapshot(mesh.Materials[1]),warnings=scene.Warnings};
            });
        const string noNormals="v 0 0 0\nv 2 0 0\nv 0 3 0\nf 1 2 3\n";
        Run("obj_missing_normals_generation", noNormals,
            new {normal=new[]{0,0,1},reason="Valid triangle has an unambiguous perpendicular; loader's ComputeNormals fallback is expected to supply absent normals."}, () => {
                var mesh=Single(ObjLoader.Parse(Encoding.ASCII.GetBytes(noNormals),null,_=>null));
                TriangleGeometry(mesh); Normals(mesh,Vector3.UnitZ); return Snapshot(mesh);
            });
        const string mixedNormals="v 0 0 0\nv 2 0 0\nv 0 3 0\nvn 0 2 4\nf 1//1 2 3\n";
        Run("obj_mixed_normals_preserve_supplied", mixedNormals,
            new {normals=new[]{new[]{0,2,4},new[]{0,0,1},new[]{0,0,1}}}, () => {
                var mesh=Single(ObjLoader.Parse(Encoding.ASCII.GetBytes(mixedNormals),null,_=>null));
                TriangleGeometry(mesh); Check(mesh.Normals.Count==3,"Normal count differs");
                Near(mesh.Normals[0],new(0,2,4));Near(mesh.Normals[1],Vector3.UnitZ);Near(mesh.Normals[2],Vector3.UnitZ);return Snapshot(mesh);
            });
        const string mixedZero="v 0 0 0\nv 2 0 0\nv 0 3 0\nvn 0 0 0\nf 1//1 2 3\n";
        Run("obj_mixed_explicit_zero_preserved", mixedZero,
            new {normals=new[]{new[]{0,0,0},new[]{0,0,1},new[]{0,0,1}}}, () => {
                var mesh=Single(ObjLoader.Parse(Encoding.ASCII.GetBytes(mixedZero),null,_=>null));
                TriangleGeometry(mesh);Check(mesh.Normals.Count==3,"Normal count differs");
                Near(mesh.Normals[0],Vector3.Zero);Near(mesh.Normals[1],Vector3.UnitZ);Near(mesh.Normals[2],Vector3.UnitZ);return Snapshot(mesh);
            });
        const string suppliedNormals="v 0 0 0\nv 2 0 0\nv 0 3 0\nvn 0 2 4\nvn 0 0 0\nf 1//1 2//2 3//1\n";
        Run("obj_all_supplied_vectors_unchanged", suppliedNormals,
            new {normals=new[]{new[]{0,2,4},new[]{0,0,0},new[]{0,2,4}},normalization=false}, () => {
                var mesh=Single(ObjLoader.Parse(Encoding.ASCII.GetBytes(suppliedNormals),null,_=>null));
                TriangleGeometry(mesh);Check(mesh.Normals.SequenceEqual(new[]{new Vector3(0,2,4),Vector3.Zero,new Vector3(0,2,4)}),"Explicit vectors were changed");return Snapshot(mesh);
            });
        const string cachedNormals="v 0 0 0\nv 1 0 0\nv 0 1 0\nv 0 0 1\nf 1 2 3\nf 1 4 2\n";
        Run("obj_missing_normals_shared_cached_vertices", cachedNormals,
            new {vertices=4,triangles=2,indices=new[]{0,1,2,0,3,1},normals="shared vertices (0,1,1)/sqrt(2), unshared UnitZ and UnitY"}, () => {
                var mesh=Single(ObjLoader.Parse(Encoding.ASCII.GetBytes(cachedNormals),null,_=>null));
                Positions(mesh,new[]{Vector3.Zero,Vector3.UnitX,Vector3.UnitY,Vector3.UnitZ});Indices(mesh,0,1,2,0,3,1);
                Check(mesh.Normals.Count==4,"Cached normal count differs");
                Near(mesh.Normals[0],new Vector3(0,1,1)/MathF.Sqrt(2));Near(mesh.Normals[1],new Vector3(0,1,1)/MathF.Sqrt(2));
                Near(mesh.Normals[2],Vector3.UnitZ);Near(mesh.Normals[3],Vector3.UnitY);return Snapshot(mesh);
            });
        const string degenerate="v 0 0 0\nv 1 0 0\nv 2 0 0\nf 1 2 3\n";
        Run("obj_degenerate_missing_normals_existing_fallback", degenerate,
            new {normal=new[]{0,1,0},finite=true,reason="Existing MeshData.ComputeNormals returns UnitY for zero accumulated cross product."}, () => {
                var mesh=Single(ObjLoader.Parse(Encoding.ASCII.GetBytes(degenerate),null,_=>null));
                Positions(mesh,new[]{Vector3.Zero,Vector3.UnitX,new Vector3(2,0,0)});Indices(mesh,0,1,2);Normals(mesh,Vector3.UnitY);return Snapshot(mesh);
            });
        Run("ascii_stl_literal", AsciiStl, new {vertices=3,triangles=1,indices=new[]{0,1,2},normal=new[]{0,0,1}}, () => {
            var mesh=Single(StlLoader.Parse(Encoding.ASCII.GetBytes(AsciiStl))); TriangleGeometry(mesh); Normals(mesh,Vector3.UnitZ); return Snapshot(mesh);
        });
        foreach(bool zeroNormal in new[]{false,true})
        {
            byte[] fixture=BinaryStl(zeroNormal);
            Run(zeroNormal?"binary_stl_zero_normals_recomputed":"binary_stl_literal", fixture,
                new {bytes=134,vertices=3,triangles=1,normal=new[]{0,0,1},header="solid synthetic; exact binary size determines encoding"}, () => {
                    var mesh=Single(StlLoader.Parse(fixture)); TriangleGeometry(mesh); Normals(mesh,Vector3.UnitZ); return Snapshot(mesh);
                });
        }
        Run("glb_header_chunks_independent_decode", TriangleFixture+" material=(0.25,0.5,0.75,1)",
            new {magic="glTF",version=2,chunks=new[]{"JSON","BIN"},alignment=4,positions=new[]{new[]{0,0,0},new[]{2,0,0},new[]{0,3,0}},indices=new[]{0,1,2}}, () => {
                string path=WriteGlb("structure.glb"); byte[] bytes=File.ReadAllBytes(path);
                var parsed=DecodeGlb(bytes); using var json=JsonDocument.Parse(parsed.json);
                var rootJson=json.RootElement;
                Check(rootJson.GetProperty("asset").GetProperty("version").GetString()=="2.0","Asset version differs");
                var primitive=rootJson.GetProperty("meshes")[0].GetProperty("primitives")[0];
                var actualPositions=ReadVec3Accessor(rootJson,parsed.bin,primitive.GetProperty("attributes").GetProperty("POSITION").GetInt32());
                Check(actualPositions.Length==3,"Position count differs");
                for(int i=0;i<3;i++) Near(actualPositions[i],new[]{Vector3.Zero,new Vector3(2,0,0),new Vector3(0,3,0)}[i]);
                var accessor=rootJson.GetProperty("accessors")[primitive.GetProperty("indices").GetInt32()];
                Check(accessor.GetProperty("componentType").GetInt32()==5125 && accessor.GetProperty("count").GetInt32()==3,"Index type/count differs");
                int offset=AccessorOffset(rootJson,accessor);
                var indices=Enumerable.Range(0,3).Select(i=>BinaryPrimitives.ReadUInt32LittleEndian(parsed.bin.AsSpan(offset+i*4,4))).ToArray();
                Check(indices.SequenceEqual(new uint[]{0,1,2}),"Binary index values differ");
                var color=rootJson.GetProperty("materials")[0].GetProperty("pbrMetallicRoughness").GetProperty("baseColorFactor");
                foreach(var pair in new[]{(0,.25f),(1,.5f),(2,.75f),(3,1f)}) Near(color[pair.Item1].GetSingle(),pair.Item2);
                return new {path,sha256=Hash(bytes),bytes=bytes.Length,json_bytes=parsed.json.Length,bin_bytes=parsed.bin.Length,positions=actualPositions.Select(Vec),indices};
            });
        Run("glb_semantic_roundtrip", TriangleFixture+" material=(0.25,0.5,0.75,1)",
            new {vertices=3,triangles=1,indices=new[]{0,1,2},normal=new[]{0,0,1},diffuse=new[]{.25,.5,.75},opacity=1}, () => {
                string path=WriteGlb("roundtrip.glb"); byte[] bytes=File.ReadAllBytes(path);
                var scene=GltfLoader.Parse(bytes); var mesh=Single(scene); TriangleGeometry(mesh); Normals(mesh,Vector3.UnitZ);
                Near(mesh.Materials[0].Diffuse,new(.25f,.5f,.75f)); Near(mesh.Materials[0].Opacity,1);
                return new {path,sha256=Hash(bytes),mesh=Snapshot(mesh),material=MaterialSnapshot(mesh.Materials[0]),warnings=scene.Warnings};
            });
        Run("unsupported_format_rejected", "bytes=[]; path=synthetic.unsupported", new {exception="NotSupportedException",supported=false}, () => {
            Check(!ModelImporter.IsSupported("synthetic.unsupported"),"Unsupported suffix accepted");
            var ex=Expect<NotSupportedException>(()=>ModelImporter.Import(Array.Empty<byte>(),"synthetic.unsupported"));
            return new {exception=ex.GetType().Name,message=ex.Message};
        });
        foreach(string extension in new[]{".obj",".stl"})
            Run("empty_geometry_rejected"+extension, "empty byte array; "+extension, new {exception="InvalidDataException"}, () => {
                var ex=Expect<InvalidDataException>(()=>ModelImporter.Import(Array.Empty<byte>(),"synthetic"+extension));
                return new {exception=ex.GetType().Name,message=ex.Message};
            });
        Run("source_provenance_unchanged", JsonSerializer.Serialize(Sources), new {source_count=Sources.Count,unchanged=true}, () => {
            foreach(var source in Sources) Check(Hash(File.ReadAllBytes(source.Key))==source.Value,"Source changed: "+source.Key);
            return new {source_count=Sources.Count,unchanged=true};
        });

        int failures=Records.Count(row=>(string)row["verdict"]! == "FAIL");
        int selected=Records.Count(row=>(string)row["test_id"]! != "directx-core.source_provenance_unchanged");
        int exitCode=failures==0 && selected>0?0:1;
        foreach(var row in Records) { row["exit_code"]=exitCode; row["exit_code_scope"]="whole harness; individual verdict is separate"; }
        var report=new {verdict=exitCode==0?"PASS":"FAIL",tests_executed=Records.Count,tests_passing=Records.Count-failures,tests_failing=failures,
            revision=Revision,source_hashes=Sources,source_manifest_scope="all standalone Core C# source plus project and harness source; excludes generated bin/obj",
            environment=new {runtime=Environment.Version.ToString(),os=Environment.OSVersion.ToString(),architecture=System.Runtime.InteropServices.RuntimeInformation.ProcessArchitecture.ToString(),
                core_assembly=AssemblyEvidence(typeof(MeshData).Assembly),sharpgltf_assembly=AssemblyEvidence(typeof(SharpGLTF.Schema2.ModelRoot).Assembly),harness_assembly=AssemblyEvidence(typeof(Program).Assembly)},
            unqualified=new[]{"MSZIP","binary X","HXX","UI/rendering","multi-material GLB export","external glTF buffers","malformed-format fuzzing","physical equipment"},records=Records};
        string temporary=Output+".tmp"; File.WriteAllText(temporary,JsonSerializer.Serialize(report,JsonOptions)); File.Move(temporary,Output);
        Console.WriteLine(JsonSerializer.Serialize(new {verdict=report.verdict,tests_executed=Records.Count,tests_passing=Records.Count-failures,tests_failing=failures,output=Output}));
        return exitCode;
    }

    static void Run(string id,string fixture,object expected,Func<object> action)=>Run(id,Encoding.UTF8.GetBytes(fixture),expected,action);
    static void Run(string id,byte[] fixture,object expected,Func<object> action)
    {
        if(CasePrefix is not null && !id.StartsWith(CasePrefix,StringComparison.Ordinal) && id != "source_provenance_unchanged") return;
        string timestamp=DateTimeOffset.UtcNow.ToString("O"); double? cpuStart=Cpu(); var watch=Stopwatch.StartNew();
        object? actual=null; string verdict="PASS",error="";
        try { actual=action(); } catch(Exception ex) { verdict="FAIL"; error=ex.ToString(); actual=new {exception=ex.GetType().Name,message=ex.Message}; }
        watch.Stop(); double? cpuEnd=Cpu();
        Records.Add(new(){["test_id"]="directx-core."+id,["utility"]="DirectX-3D-Viewer.Core",["revision"]=Revision,
            ["test_input"]=new {identity=id,sha256=Hash(fixture),bytes=fixture.Length,fixture_kind="synthetic literal or deterministic bytes defined in Program.cs"},
            ["expected_outcome"]=expected,["actual_outcome"]=actual,["verdict"]=verdict,["elapsed_ms"]=watch.Elapsed.TotalMilliseconds,
            ["cpu_ms"]=cpuStart.HasValue&&cpuEnd.HasValue?cpuEnd-cpuStart:null,["peak_memory_bytes"]=Peak(),["gpu_time_ms"]=null,["gpu_memory_bytes"]=null,
            ["measurement_scope"]="process CPU delta; process lifetime peak working set; CPU geometry only",["error_output"]=error,["timestamp"]=timestamp,
            ["source_hashes"]=Sources,["evidence"]=new[]{Output},["environment"]=new {runtime=Environment.Version.ToString(),os=Environment.OSVersion.ToString()}});
        Console.WriteLine($"{verdict} {id}: {watch.Elapsed.TotalMilliseconds:F4} ms");
        if(error.Length>0) Console.WriteLine(error);
    }
    static double? Cpu() { try {using var p=Process.GetCurrentProcess();return p.TotalProcessorTime.TotalMilliseconds;} catch {return null;} }
    static long? Peak() { try {using var p=Process.GetCurrentProcess();p.Refresh();return p.PeakWorkingSet64;} catch {return null;} }
    static string Hash(byte[] value)=>Convert.ToHexString(SHA256.HashData(value)).ToLowerInvariant();
    static object AssemblyEvidence(System.Reflection.Assembly assembly)=>new {name=assembly.FullName,path=assembly.Location,sha256=Hash(File.ReadAllBytes(assembly.Location))};
    static void Check(bool condition,string message) {if(!condition)throw new InvalidOperationException(message);}
    static void Near(float actual,float expected) {Check(float.IsFinite(actual)&&MathF.Abs(actual-expected)<=Tolerance,$"Expected {expected}, actual {actual}");}
    static void Near(Vector3 actual,Vector3 expected) {Near(actual.X,expected.X);Near(actual.Y,expected.Y);Near(actual.Z,expected.Z);}
    static float[] Vec(Vector3 value)=>new[]{value.X,value.Y,value.Z};
    static object Snapshot(MeshData mesh)=>new {positions=mesh.Positions.Select(Vec),normals=mesh.Normals.Select(Vec),indices=mesh.Indices,vertices=mesh.VertexCount,triangles=mesh.TriangleCount};
    static object MaterialSnapshot(MeshMaterial material)=>new {material.Name,diffuse=Vec(material.Diffuse),material.Opacity,material.Shininess,specular=Vec(material.Specular),emissive=Vec(material.Emissive),material.TextureFile};
    static SceneModel Scene(MeshData mesh) {var scene=new SceneModel();scene.Meshes.Add(mesh);return scene;}
    static MeshData Triangle() {var mesh=new MeshData {Name="synthetic"};mesh.Positions.AddRange(new[]{Vector3.Zero,new Vector3(2,0,0),new Vector3(0,3,0)});mesh.Indices.AddRange(new[]{0,1,2});mesh.ComputeNormals();return mesh;}
    static MeshData Single(SceneModel scene) {Check(scene.Meshes.Count==1,$"Expected one mesh, actual {scene.Meshes.Count}");return scene.Meshes[0];}
    static void Positions(MeshData mesh,Vector3[] expected) {Check(mesh.Positions.Count==expected.Length,"Vertex count differs");for(int i=0;i<expected.Length;i++)Near(mesh.Positions[i],expected[i]);}
    static void Normals(MeshData mesh,Vector3 expected) {Check(mesh.Normals.Count==mesh.Positions.Count,"Normal count differs");foreach(var n in mesh.Normals)Near(n,expected);}
    static void Indices(MeshData mesh,params int[] expected)=>Check(mesh.Indices.SequenceEqual(expected),"Triangle index order differs");
    static void TriangleGeometry(MeshData mesh) {Positions(mesh,new[]{Vector3.Zero,new Vector3(2,0,0),new Vector3(0,3,0)});Indices(mesh,0,1,2);Check(mesh.TriangleCount==1,"Triangle count differs");}
    static void Material(MeshMaterial material) {Near(material.Diffuse,new(.25f,.5f,.75f));Near(material.Opacity,.6f);Near(material.Shininess,12);Near(material.Specular,new(.1f,.2f,.3f));Near(material.Emissive,new(.02f,.03f,.04f));}
    static T Expect<T>(Action action) where T:Exception {try{action();}catch(T ex){return ex;}throw new InvalidOperationException("Expected "+typeof(T).Name);}
    static byte[] BinaryStl(bool zeroNormal)
    {
        // Independent STL framing: 80-byte header, uint32 count, 12 float32 values, uint16 attribute length.
        byte[] bytes=new byte[134]; Encoding.ASCII.GetBytes("solid synthetic").CopyTo(bytes,0); BinaryPrimitives.WriteUInt32LittleEndian(bytes.AsSpan(80,4),1);
        float[] values={0,0,zeroNormal?0:1,0,0,0,2,0,0,0,3,0};
        for(int i=0;i<values.Length;i++)BinaryPrimitives.WriteSingleLittleEndian(bytes.AsSpan(84+i*4,4),values[i]);
        return bytes;
    }
    static string WriteGlb(string filename)
    {
        var mesh=Triangle();mesh.Materials.Add(new MeshMaterial{Name="synthetic material",Diffuse=new(.25f,.5f,.75f),Opacity=1});mesh.Groups.Add(new(0,3,0));
        string path=Path.Combine(FixtureRoot,filename);GlbWriter.Write(Scene(mesh),path);return path;
    }
    static (byte[] json,byte[] bin) DecodeGlb(byte[] bytes)
    {
        // GLB 2.0 framing checked independently of SharpGLTF and the production writer.
        Check(bytes.Length>=28,"GLB too short");Check(BinaryPrimitives.ReadUInt32LittleEndian(bytes)==0x46546c67,"GLB magic differs");
        Check(BinaryPrimitives.ReadUInt32LittleEndian(bytes.AsSpan(4,4))==2,"GLB version differs");
        Check(BinaryPrimitives.ReadUInt32LittleEndian(bytes.AsSpan(8,4))==bytes.Length,"GLB total length differs");
        int jsonLength=checked((int)BinaryPrimitives.ReadUInt32LittleEndian(bytes.AsSpan(12,4)));
        Check(jsonLength%4==0 && jsonLength>=4 && jsonLength<=bytes.Length-28,"JSON alignment/bounds differ");
        Check(BinaryPrimitives.ReadUInt32LittleEndian(bytes.AsSpan(16,4))==0x4e4f534a,"First chunk is not JSON");
        int binHeader=20+jsonLength;int binLength=checked((int)BinaryPrimitives.ReadUInt32LittleEndian(bytes.AsSpan(binHeader,4)));
        Check(binLength%4==0&&binHeader+8+binLength==bytes.Length,"BIN alignment/bounds differ");
        Check(BinaryPrimitives.ReadUInt32LittleEndian(bytes.AsSpan(binHeader+4,4))==0x004e4942,"Second chunk is not BIN");
        return (bytes.AsSpan(20,jsonLength).ToArray(),bytes.AsSpan(binHeader+8,binLength).ToArray());
    }
    static int AccessorOffset(JsonElement root,JsonElement accessor)
    {
        var view=root.GetProperty("bufferViews")[accessor.GetProperty("bufferView").GetInt32()];
        return (view.TryGetProperty("byteOffset",out var vo)?vo.GetInt32():0)+(accessor.TryGetProperty("byteOffset",out var ao)?ao.GetInt32():0);
    }
    static Vector3[] ReadVec3Accessor(JsonElement root,byte[] bin,int index)
    {
        var accessor=root.GetProperty("accessors")[index];
        Check(accessor.GetProperty("componentType").GetInt32()==5126 && accessor.GetProperty("type").GetString()=="VEC3","Position accessor type differs");
        int offset=AccessorOffset(root,accessor);int count=accessor.GetProperty("count").GetInt32();var result=new Vector3[count];
        for(int i=0;i<count;i++)result[i]=new(BinaryPrimitives.ReadSingleLittleEndian(bin.AsSpan(offset+i*12,4)),BinaryPrimitives.ReadSingleLittleEndian(bin.AsSpan(offset+i*12+4,4)),BinaryPrimitives.ReadSingleLittleEndian(bin.AsSpan(offset+i*12+8,4)));
        return result;
    }
}
