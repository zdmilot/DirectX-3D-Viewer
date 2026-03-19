using System.Linq;
using System.Text.RegularExpressions;
using System.Windows;
using GongSolutions.Wpf.DragDrop;
using Microsoft.Win32;

namespace HxLabwrEd2.StaticHelpers;

public static class DragDropFileLoadHelper
{
	public static OpenFileDialog OpenFileDlgReference { get; set; }

	public static void DragOver(IDropInfo dropInfo)
	{
		DataObject dataObject = dropInfo.Data as DataObject;
		if (dataObject.ContainsFileDropList())
		{
			if (!TryGetFirstValidFileName(dataObject, out var _) || FilteringEditLabwareHelper.IsEditingLabwareForFiltering)
			{
				dropInfo.Effects = DragDropEffects.None;
			}
			else
			{
				dropInfo.Effects = DragDropEffects.Link;
			}
		}
	}

	public static bool TryGetFirstValidFileName(DataObject dataObject, out string firstValidFileName)
	{
		string labwareFileExtensions = ".crk|.ctr|.rck|.tml";
		firstValidFileName = (from fileName in dataObject.GetFileDropList().Cast<string>().ToList()
			where Regex.IsMatch(fileName, labwareFileExtensions, RegexOptions.IgnoreCase)
			select fileName).FirstOrDefault();
		if (string.IsNullOrEmpty(firstValidFileName))
		{
			return false;
		}
		return true;
	}
}
