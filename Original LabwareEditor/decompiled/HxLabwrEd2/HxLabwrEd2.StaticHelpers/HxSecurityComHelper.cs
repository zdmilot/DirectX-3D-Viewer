using Hamilton.Interop.HxSecurityCom;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.StaticHelpers;

public static class HxSecurityComHelper
{
	private static readonly HxSecurityComClass hxSecurityCom = new HxSecurityComClass();

	public static string CurrentUserName
	{
		get
		{
			try
			{
				return hxSecurityCom.GetCurrentUserName();
			}
			catch
			{
				return string.Empty;
			}
		}
	}

	public static AccessRight CurrentAccessRight
	{
		get
		{
			try
			{
				return (AccessRight)hxSecurityCom.GetCurrentAccessRight();
			}
			catch
			{
				return AccessRight.NoAccess;
			}
		}
	}

	public static FileValidation GetFileValidation(string fileName)
	{
		int retValue = 0;
		hxSecurityCom.GetFileValidation(fileName, ref retValue);
		return (FileValidation)retValue;
	}

	public static void SetFileValidation(string fileName, FileValidation fileValidation)
	{
		hxSecurityCom.SetFileValidation(fileName, (int)fileValidation, "*");
	}
}
