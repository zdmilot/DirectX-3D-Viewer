using System;
using System.IO;
using System.Windows;

namespace HxLabwrEd2.StaticHelpers;

public static class CommandLineArgumentHelper
{
	public static object Sender { get; private set; }

	public static StartupEventArgs StartupEventArgs { get; private set; }

	public static string FirstLabwarePath { get; private set; }

	public static bool LimitedFlag { get; private set; }

	public static bool ArgsContainFullPath { get; private set; }

	public static bool CategoryFilterManager { get; private set; }

	internal static void CheckCommandLineParameters(object sender, StartupEventArgs startupEventArgs)
	{
		Sender = sender;
		if (startupEventArgs != null && startupEventArgs.Args != null && startupEventArgs.Args.Length != 0)
		{
			StartupEventArgs = startupEventArgs;
			if (FindAndSetFirstLabwarePath())
			{
				FindAndSetLimitedFlag();
			}
			FindAndSetCategoryFilterManagager();
		}
	}

	private static bool FindAndSetFirstLabwarePath()
	{
		string[] args = StartupEventArgs.Args;
		foreach (string text in args)
		{
			bool flag = false;
			try
			{
				if (!string.IsNullOrEmpty(Path.GetFullPath(text)))
				{
					flag = true;
				}
			}
			catch (Exception)
			{
			}
			if (flag && Path.IsPathRooted(text))
			{
				ArgsContainFullPath = true;
				switch (Path.GetExtension(text))
				{
				case ".ctr":
				case ".rck":
				case ".crk":
				case ".tml":
					FirstLabwarePath = text;
					return true;
				}
			}
		}
		return false;
	}

	private static void FindAndSetLimitedFlag()
	{
		string[] args = StartupEventArgs.Args;
		foreach (string text in args)
		{
			if (string.Compare("limited", text.ToLower()) == 0)
			{
				LimitedFlag = true;
				break;
			}
		}
	}

	private static void FindAndSetCategoryFilterManagager()
	{
		string[] args = StartupEventArgs.Args;
		foreach (string text in args)
		{
			if (string.Compare("categoryfiltermanager", text.ToLower()) == 0)
			{
				CategoryFilterManager = true;
				break;
			}
		}
	}
}
