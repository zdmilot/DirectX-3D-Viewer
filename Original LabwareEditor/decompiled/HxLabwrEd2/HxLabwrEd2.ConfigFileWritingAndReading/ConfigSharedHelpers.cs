using System;
using System.IO;

namespace HxLabwrEd2.ConfigFileWritingAndReading;

internal static class ConfigSharedHelpers
{
	public static string GetQualifiedPath(string pathToQualify, string parentFilePath, string standardDirectoryPath)
	{
		string result = "";
		if (string.IsNullOrEmpty(pathToQualify) || string.IsNullOrEmpty(parentFilePath) || string.IsNullOrEmpty(standardDirectoryPath))
		{
			return result;
		}
		if (pathToQualify.Contains(":"))
		{
			return pathToQualify;
		}
		if (Path.IsPathRooted(pathToQualify) && ((Path.IsPathRooted(parentFilePath) && Path.GetPathRoot(pathToQualify) != Path.GetPathRoot(parentFilePath)) || Path.GetPathRoot(pathToQualify) != Path.GetPathRoot(standardDirectoryPath)))
		{
			return pathToQualify;
		}
		if (string.IsNullOrWhiteSpace(Path.GetExtension(pathToQualify)))
		{
			return pathToQualify;
		}
		try
		{
			Path.GetFullPath(pathToQualify);
		}
		catch (Exception)
		{
			return pathToQualify;
		}
		if (pathToQualify[0] == '.')
		{
			string directoryName = Path.GetDirectoryName(parentFilePath);
			try
			{
				result = Path.GetFullPath(Path.Combine(directoryName, pathToQualify));
			}
			catch (Exception)
			{
				return pathToQualify;
			}
			if (!File.Exists(result))
			{
				try
				{
					result = Path.GetFullPath(Path.Combine(standardDirectoryPath, pathToQualify));
				}
				catch (Exception)
				{
					return pathToQualify;
				}
				if (!File.Exists(result))
				{
					result = "";
					string[] array = new string[2] { parentFilePath, standardDirectoryPath };
					int startIndex = 0;
					for (startIndex = pathToQualify.IndexOf("\\", startIndex); startIndex != -1; startIndex = pathToQualify.IndexOf("\\", startIndex + 1))
					{
						string text = pathToQualify.Substring(startIndex);
						if (string.IsNullOrEmpty(text))
						{
							return result;
						}
						for (int i = 0; i < array.Length; i++)
						{
							string text2 = Path.Combine(array[i], text);
							if (File.Exists(text2))
							{
								return text2;
							}
						}
					}
				}
			}
		}
		else
		{
			result = Path.Combine(standardDirectoryPath, pathToQualify);
		}
		if (string.IsNullOrWhiteSpace(result))
		{
			result = pathToQualify;
		}
		return result;
	}

	public static string GetRelativeToDefault(string qualifiedPath, string standardDirectoryPath)
	{
		try
		{
			if (string.IsNullOrEmpty(qualifiedPath) || string.IsNullOrEmpty(standardDirectoryPath))
			{
				return qualifiedPath;
			}
			if (Path.IsPathRooted(qualifiedPath) && Path.GetPathRoot(qualifiedPath) != Path.GetPathRoot(standardDirectoryPath))
			{
				return qualifiedPath;
			}
			if (string.IsNullOrWhiteSpace(Path.GetExtension(qualifiedPath)))
			{
				return qualifiedPath;
			}
			try
			{
				Path.GetFullPath(qualifiedPath);
			}
			catch (Exception)
			{
				return qualifiedPath;
			}
			string text = qualifiedPath.ToLower();
			string value = standardDirectoryPath.ToLower();
			if (text.Contains(value))
			{
				int num = text.IndexOf(value);
				qualifiedPath = qualifiedPath.Substring(standardDirectoryPath.Length + num);
			}
			qualifiedPath = qualifiedPath.TrimStart('\\', '/');
		}
		catch (Exception)
		{
		}
		return qualifiedPath;
	}

	public static string GetRelativeToParent(string pathToMakeRelative, string parentFilePath, string standardDirectoryPath)
	{
		string text = "";
		try
		{
			if (string.IsNullOrEmpty(pathToMakeRelative) || string.IsNullOrEmpty(parentFilePath) || string.IsNullOrEmpty(standardDirectoryPath))
			{
				return pathToMakeRelative;
			}
			if (Path.IsPathRooted(pathToMakeRelative) && ((Path.IsPathRooted(parentFilePath) && Path.GetPathRoot(pathToMakeRelative) != Path.GetPathRoot(parentFilePath)) || Path.GetPathRoot(pathToMakeRelative) != Path.GetPathRoot(standardDirectoryPath)))
			{
				return pathToMakeRelative;
			}
			if (string.IsNullOrWhiteSpace(Path.GetExtension(pathToMakeRelative)))
			{
				return pathToMakeRelative;
			}
			try
			{
				Path.GetFullPath(pathToMakeRelative);
			}
			catch (Exception)
			{
				return pathToMakeRelative;
			}
			if (pathToMakeRelative[0] == '.')
			{
				return pathToMakeRelative;
			}
			string directoryName = Path.GetDirectoryName(parentFilePath);
			if (Path.IsPathRooted(pathToMakeRelative) && !Path.GetPathRoot(pathToMakeRelative).Equals(Path.DirectorySeparatorChar.ToString(), StringComparison.Ordinal))
			{
				pathToMakeRelative = Path.Combine(standardDirectoryPath, pathToMakeRelative);
			}
			Uri uri = new Uri(directoryName + "\\");
			Uri uri2 = new Uri(pathToMakeRelative);
			text = Uri.UnescapeDataString(uri.MakeRelativeUri(uri2).ToString());
			text = text.Replace("/", "\\");
			if (text[0] != '.')
			{
				text = ".\\" + text;
			}
		}
		catch (Exception)
		{
		}
		return text;
	}
}
