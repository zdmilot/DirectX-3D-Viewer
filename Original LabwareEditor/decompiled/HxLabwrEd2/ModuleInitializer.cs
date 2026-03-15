using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Reflection;

public static class ModuleInitializer
{
	private static readonly string hamiltonResourcesKey = "costura.hamiltonresources.dll.compressed";

	public static void Initialize()
	{
		Load(hamiltonResourcesKey);
	}

	public static void Load(string _costuraKey)
	{
		using Stream stream = GetFodyResource(_costuraKey, Assembly.GetExecutingAssembly());
		byte[] array = new byte[stream.Length];
		stream.Read(array, 0, array.Length);
		Assembly.Load(array);
	}

	public static Stream GetFodyResource(string key, Assembly _assembly)
	{
		string text = _assembly.GetManifestResourceNames().FirstOrDefault((string x) => x.Contains(key.ToLower()));
		if (text.EndsWith(".compressed"))
		{
			using (DeflateStream source = new DeflateStream(_assembly.GetManifestResourceStream(text), CompressionMode.Decompress))
			{
				MemoryStream memoryStream = new MemoryStream();
				CopyTo(source, memoryStream);
				memoryStream.Position = 0L;
				return memoryStream;
			}
		}
		return null;
	}

	private static void CopyTo(Stream source, Stream destination)
	{
		byte[] array = new byte[81920];
		int count;
		while ((count = source.Read(array, 0, array.Length)) != 0)
		{
			destination.Write(array, 0, count);
		}
	}
}
