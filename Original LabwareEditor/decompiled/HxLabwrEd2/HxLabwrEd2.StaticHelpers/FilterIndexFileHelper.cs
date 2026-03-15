using System;
using System.Collections.Generic;
using System.IO;
using System.Windows;
using System.Windows.Threading;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Ioc;
using HxLabwrEd2.ConfigFileWritingAndReading;
using HxLabwrEd2.Model;
using HxLabwrEd2.ViewModel;

namespace HxLabwrEd2.StaticHelpers;

public static class FilterIndexFileHelper
{
	public static bool GenerateLabwareIndexFile(List<LabwareIndexData> labwareIndexData = null)
	{
		if (labwareIndexData == null)
		{
			labwareIndexData = ConvertNodeDataToIndexData(ConfigFileReader.ReadAllLabwareNodeData(HxRegHelper.LabwarePath));
		}
		return ConfigFileWriter.WriteLabwareIndexFile(HxRegHelper.LabwarePath + "\\Index.dat", labwareIndexData);
	}

	public static List<LabwareIndexData> ConvertNodeDataToIndexData(List<LabwareNodeData> labwareNodeData)
	{
		List<LabwareIndexData> list = new List<LabwareIndexData>();
		foreach (LabwareNodeData labwareNodeDatum in labwareNodeData)
		{
			if (labwareNodeDatum.CategoryIds.Count <= 0)
			{
				continue;
			}
			foreach (int categoryId in labwareNodeDatum.CategoryIds)
			{
				list.Add(new LabwareIndexData(categoryId, labwareNodeDatum.Name, labwareNodeDatum.Description, Path.GetFileName(labwareNodeDatum.FilePath), labwareNodeDatum.FilePathVectorRelative));
			}
		}
		return list;
	}

	public static bool SaveFilterAndReplaceIndexFile(string filterName, List<LabwareIndexData> data)
	{
		if (SaveFilterDataToFile(filterName, data))
		{
			return ReplaceIndexFileWithFilterFile(filterName);
		}
		return false;
	}

	public static bool DeleteFilterFile(string filterName)
	{
		try
		{
			if (File.Exists(HxRegHelper.ConfigPath + "\\Labware Filtering\\" + filterName + ".dat"))
			{
				File.Delete(HxRegHelper.ConfigPath + "\\Labware Filtering\\" + filterName + ".dat");
			}
		}
		catch (Exception ex)
		{
			string trimmedMessage = ex.Message.TrimEnd(Environment.NewLine.ToCharArray());
			Application.Current.Dispatcher.BeginInvoke((Action)delegate
			{
				DialogWindowHelper.ShowDialogWithProportionalDimensions("Error!", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogSimpleWarningViewModel>(), trimmedMessage, 0.45, 0.25);
			}, DispatcherPriority.Background, null);
			return false;
		}
		return true;
	}

	public static bool ReplaceIndexFileWithFilterFile(string filterName)
	{
		try
		{
			File.Copy(HxRegHelper.ConfigPath + "\\Labware Filtering\\" + filterName + ".dat", Path.GetTempPath() + "\\" + filterName + ".dat", overwrite: true);
			File.Delete(HxRegHelper.LabwarePath + "\\Index.dat");
			File.Move(Path.GetTempPath() + "\\" + filterName + ".dat", HxRegHelper.LabwarePath + "\\Index.dat");
		}
		catch (Exception ex)
		{
			string trimmedMessage = ex.Message.TrimEnd(Environment.NewLine.ToCharArray());
			Application.Current.Dispatcher.BeginInvoke((Action)delegate
			{
				DialogWindowHelper.ShowDialogWithProportionalDimensions("Error!", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogSimpleWarningViewModel>(), trimmedMessage, 0.45, 0.25);
			}, DispatcherPriority.Background, null);
			return false;
		}
		return true;
	}

	public static bool SaveFilterDataToFile(string filterName, List<LabwareIndexData> data)
	{
		return ConfigFileWriter.WriteLabwareIndexFile(HxRegHelper.ConfigPath + "\\Labware Filtering\\" + filterName + ".dat", data);
	}
}
