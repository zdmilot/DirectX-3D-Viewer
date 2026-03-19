using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Threading;

namespace Costura;

[CompilerGenerated]
internal static class AssemblyLoader
{
	private static object nullCacheLock = new object();

	private static Dictionary<string, bool> nullCache = new Dictionary<string, bool>();

	private static Dictionary<string, string> assemblyNames = new Dictionary<string, string>();

	private static Dictionary<string, string> symbolNames = new Dictionary<string, string>();

	private static int isAttached;

	private static string CultureToString(CultureInfo culture)
	{
		if (culture == null)
		{
			return "";
		}
		return culture.Name;
	}

	private static Assembly ReadExistingAssembly(AssemblyName name)
	{
		Assembly[] assemblies = AppDomain.CurrentDomain.GetAssemblies();
		foreach (Assembly assembly in assemblies)
		{
			AssemblyName name2 = assembly.GetName();
			if (string.Equals(name2.Name, name.Name, StringComparison.InvariantCultureIgnoreCase) && string.Equals(CultureToString(name2.CultureInfo), CultureToString(name.CultureInfo), StringComparison.InvariantCultureIgnoreCase))
			{
				return assembly;
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

	private static Stream LoadStream(string fullName)
	{
		Assembly executingAssembly = Assembly.GetExecutingAssembly();
		if (fullName.EndsWith(".compressed"))
		{
			using (Stream stream = executingAssembly.GetManifestResourceStream(fullName))
			{
				using DeflateStream source = new DeflateStream(stream, CompressionMode.Decompress);
				MemoryStream memoryStream = new MemoryStream();
				CopyTo(source, memoryStream);
				memoryStream.Position = 0L;
				return memoryStream;
			}
		}
		return executingAssembly.GetManifestResourceStream(fullName);
	}

	private static Stream LoadStream(Dictionary<string, string> resourceNames, string name)
	{
		if (resourceNames.TryGetValue(name, out var value))
		{
			return LoadStream(value);
		}
		return null;
	}

	private static byte[] ReadStream(Stream stream)
	{
		byte[] array = new byte[stream.Length];
		stream.Read(array, 0, array.Length);
		return array;
	}

	private static Assembly ReadFromEmbeddedResources(Dictionary<string, string> assemblyNames, Dictionary<string, string> symbolNames, AssemblyName requestedAssemblyName)
	{
		string text = requestedAssemblyName.Name.ToLowerInvariant();
		if (requestedAssemblyName.CultureInfo != null && !string.IsNullOrEmpty(requestedAssemblyName.CultureInfo.Name))
		{
			text = $"{requestedAssemblyName.CultureInfo.Name}.{text}";
		}
		byte[] rawAssembly;
		using (Stream stream = LoadStream(assemblyNames, text))
		{
			if (stream == null)
			{
				return null;
			}
			rawAssembly = ReadStream(stream);
		}
		using (Stream stream2 = LoadStream(symbolNames, text))
		{
			if (stream2 != null)
			{
				byte[] rawSymbolStore = ReadStream(stream2);
				return Assembly.Load(rawAssembly, rawSymbolStore);
			}
		}
		return Assembly.Load(rawAssembly);
	}

	public static Assembly ResolveAssembly(object sender, ResolveEventArgs e)
	{
		lock (nullCacheLock)
		{
			if (nullCache.ContainsKey(e.Name))
			{
				return null;
			}
		}
		AssemblyName assemblyName = new AssemblyName(e.Name);
		Assembly assembly = ReadExistingAssembly(assemblyName);
		if (assembly != null)
		{
			return assembly;
		}
		assembly = ReadFromEmbeddedResources(assemblyNames, symbolNames, assemblyName);
		if (assembly == null)
		{
			lock (nullCacheLock)
			{
				nullCache[e.Name] = true;
			}
			if ((assemblyName.Flags & AssemblyNameFlags.Retargetable) != AssemblyNameFlags.None)
			{
				assembly = Assembly.Load(assemblyName);
			}
		}
		return assembly;
	}

	static AssemblyLoader()
	{
		assemblyNames.Add("caliburn.micro", "costura.caliburn.micro.dll.compressed");
		assemblyNames.Add("caliburn.micro.platform.core", "costura.caliburn.micro.platform.core.dll.compressed");
		assemblyNames.Add("caliburn.micro.platform", "costura.caliburn.micro.platform.dll.compressed");
		assemblyNames.Add("commonservicelocator", "costura.commonservicelocator.dll.compressed");
		assemblyNames.Add("costura", "costura.costura.dll.compressed");
		assemblyNames.Add("duovia.fuzzystrings", "costura.duovia.fuzzystrings.dll.compressed");
		symbolNames.Add("duovia.fuzzystrings", "costura.duovia.fuzzystrings.pdb.compressed");
		assemblyNames.Add("fontawesome.wpf", "costura.fontawesome.wpf.dll.compressed");
		assemblyNames.Add("galasoft.mvvmlight", "costura.galasoft.mvvmlight.dll.compressed");
		assemblyNames.Add("galasoft.mvvmlight.extras", "costura.galasoft.mvvmlight.extras.dll.compressed");
		symbolNames.Add("galasoft.mvvmlight.extras", "costura.galasoft.mvvmlight.extras.pdb.compressed");
		symbolNames.Add("galasoft.mvvmlight", "costura.galasoft.mvvmlight.pdb.compressed");
		assemblyNames.Add("galasoft.mvvmlight.platform", "costura.galasoft.mvvmlight.platform.dll.compressed");
		symbolNames.Add("galasoft.mvvmlight.platform", "costura.galasoft.mvvmlight.platform.pdb.compressed");
		assemblyNames.Add("gongsolutions.wpf.dragdrop", "costura.gongsolutions.wpf.dragdrop.dll.compressed");
		symbolNames.Add("gongsolutions.wpf.dragdrop", "costura.gongsolutions.wpf.dragdrop.pdb.compressed");
		assemblyNames.Add("hamiltonresources", "costura.hamiltonresources.dll.compressed");
		assemblyNames.Add("hxcarriermodeljoiner", "costura.hxcarriermodeljoiner.dll.compressed");
		assemblyNames.Add("hxlabwrcatassigner", "costura.hxlabwrcatassigner.dll.compressed");
		assemblyNames.Add("hxlabwrcatmanager", "costura.hxlabwrcatmanager.dll.compressed");
		assemblyNames.Add("hxlabwrcatserde", "costura.hxlabwrcatserde.dll.compressed");
		assemblyNames.Add("hxlabwrcattools", "costura.hxlabwrcattools.dll.compressed");
		assemblyNames.Add("mahapps.metro", "costura.mahapps.metro.dll.compressed");
		symbolNames.Add("mahapps.metro", "costura.mahapps.metro.pdb.compressed");
		assemblyNames.Add("microsoft.xaml.behaviors", "costura.microsoft.xaml.behaviors.dll.compressed");
		symbolNames.Add("microsoft.xaml.behaviors", "costura.microsoft.xaml.behaviors.pdb.compressed");
		assemblyNames.Add("moduleinit", "costura.moduleinit.dll.compressed");
		assemblyNames.Add("system.windows.interactivity", "costura.system.windows.interactivity.dll.compressed");
		assemblyNames.Add("xceed.wpf.toolkit", "costura.xceed.wpf.toolkit.dll.compressed");
	}

	public static void Attach()
	{
		if (Interlocked.Exchange(ref isAttached, 1) == 1)
		{
			return;
		}
		AppDomain.CurrentDomain.AssemblyResolve += delegate(object sender, ResolveEventArgs e)
		{
			lock (nullCacheLock)
			{
				if (nullCache.ContainsKey(e.Name))
				{
					return (Assembly)null;
				}
			}
			AssemblyName assemblyName = new AssemblyName(e.Name);
			Assembly assembly = ReadExistingAssembly(assemblyName);
			if (assembly != null)
			{
				return assembly;
			}
			assembly = ReadFromEmbeddedResources(assemblyNames, symbolNames, assemblyName);
			if (assembly == null)
			{
				lock (nullCacheLock)
				{
					nullCache[e.Name] = true;
				}
				if ((assemblyName.Flags & AssemblyNameFlags.Retargetable) != AssemblyNameFlags.None)
				{
					assembly = Assembly.Load(assemblyName);
				}
			}
			return assembly;
		};
	}
}
