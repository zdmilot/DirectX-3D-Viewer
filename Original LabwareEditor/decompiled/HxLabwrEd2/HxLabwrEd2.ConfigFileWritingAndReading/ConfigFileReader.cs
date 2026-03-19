using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Threading;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Messaging;
using Hamilton.Interop.HxCfgFil;
using HxLabwrCatSerDe.Models;
using HxLabwrCatSerDe.Serialization;
using HxLabwrEd2.CustomControls.RackDrawing.CircularRackDrawingMath;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;
using HxLabwrEd2.ViewModel;

namespace HxLabwrEd2.ConfigFileWritingAndReading;

public static class ConfigFileReader
{
	public static Labware ReadLabwareFromFile(string filePath)
	{
		Labware labware = null;
		if (!string.IsNullOrEmpty(filePath))
		{
			try
			{
				((IHxCfgFile6)new HxCfgFileClass()).LoadFile(filePath);
				string extension = Path.GetExtension(filePath);
				if (extension.Contains(".tml"))
				{
					labware = new Template();
					labware.Loading = true;
					ReadLabware(labware, filePath, "TEMPLATE", "default", 1);
					ReadTemplate(labware as Template, filePath, "TEMPLATE", "default", 1);
				}
				else if (extension.Contains(".rck"))
				{
					labware = new RectangularRack();
					labware.Loading = true;
					ReadLabware(labware, filePath, "RECTRACK", "default", 3);
					ReadRectangularRack(labware as RectangularRack, filePath, "RECTRACK", "default", 3);
				}
				else if (extension.Contains(".ctr"))
				{
					labware = new Container();
					labware.Loading = true;
					ReadLabware(labware, filePath, "CONTAINER", "default", 3);
					ReadContainer(labware as Container, filePath, "CONTAINER", "default", 3);
				}
				else if (extension.Contains(".crk"))
				{
					labware = new CircularRack
					{
						Loading = true
					};
					ReadLabware(labware, filePath, "CIRCRACK", "default", 3);
					ReadCircularRack((CircularRack)labware, filePath, "CIRCRACK", "default", 3);
				}
				labware.Validation = HxSecurityComHelper.GetFileValidation(labware.LabwareFileFullPath);
				labware.DataChanged = false;
				labware.Loading = false;
			}
			catch (Exception ex)
			{
				string trimmedMessage = ex.Message.TrimEnd(Environment.NewLine.ToCharArray());
				Application.Current.Dispatcher.BeginInvoke((Action)delegate
				{
					DialogWindowHelper.ShowDialogWithProportionalDimensions("", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogSimpleWarningViewModel>(), trimmedMessage, 0.45, 0.35);
				}, DispatcherPriority.Background, null);
				return null;
			}
		}
		return labware;
	}

	public static void UpdateRackDrawContainers(Labware labware)
	{
		HxCfgFile hxCfgFile = new HxCfgFileClass();
		string directoryName = Path.GetDirectoryName(labware.LabwareFileFullPath);
		string iDataDefName = "CONTAINER";
		string iInstanceName = "default";
		Rack rack = labware as Rack;
		rack.DrawContainers = new Dictionary<string, DrawContainer>();
		short poValue;
		double poValue2;
		if (rack.ContainerLayout == ContainerLayout.SingleContainer)
		{
			if (string.IsNullOrWhiteSpace(rack.SingleRepeatingContainer.RelativeFilePath) && string.IsNullOrWhiteSpace(rack.SingleRepeatingContainer.FilePath))
			{
				return;
			}
			string text;
			if (string.IsNullOrEmpty(directoryName))
			{
				text = rack.SingleRepeatingContainer.RelativeFilePath;
			}
			else
			{
				string text2 = Path.Combine(directoryName, rack.SingleRepeatingContainer.RelativeFilePath);
				try
				{
					text = Path.GetFullPath(text2);
				}
				catch (Exception)
				{
					text = text2;
				}
			}
			bool flag = ConfigSharedHelpers.GetRelativeToParent(text, rack.LabwareFileFullPath, HxRegHelper.LabwarePath) == rack.SingleRepeatingContainer.RelativeFilePath;
			string text3;
			if (Path.IsPathRooted(rack.SingleRepeatingContainer.FilePath) && !string.IsNullOrEmpty(Path.GetPathRoot(rack.SingleRepeatingContainer.FilePath)))
			{
				text3 = rack.SingleRepeatingContainer.FilePath;
			}
			else
			{
				string text4 = Path.Combine(HxRegHelper.LabwarePath, rack.SingleRepeatingContainer.FilePath);
				try
				{
					text3 = Path.GetFullPath(text4);
				}
				catch (Exception)
				{
					text3 = text4;
				}
			}
			bool flag2 = flag && Path.GetExtension(text) == ".ctr" && Path.GetExtension(text3) == ".ctr";
			bool flag3 = flag && File.Exists(text);
			bool flag4 = File.Exists(text3);
			DrawContainer drawContainer;
			if (!flag2 || (!flag3 && !flag4))
			{
				drawContainer = new DrawContainer(rack.SingleRepeatingContainer.FilePath, rack.SingleRepeatingContainer.RelativeFilePath, AssignedLabwareStatus.NotFound);
				drawContainer.Dimensions.Z = RackHelper.GetErrorOrEmptyWellDimension(rack);
				rack.DrawContainers.Add(rack.SingleRepeatingContainer.RelativeFilePath, drawContainer);
				return;
			}
			AssignedLabwareStatus status;
			string iFileSpec;
			if (flag3 && !string.IsNullOrEmpty(rack.LabwareFileFullPath))
			{
				status = AssignedLabwareStatus.FoundUsingRelativePath;
				iFileSpec = text;
			}
			else
			{
				status = AssignedLabwareStatus.FoundUsingAbsolutePath;
				iFileSpec = text3;
			}
			drawContainer = new DrawContainer(rack.SingleRepeatingContainer.FilePath, rack.SingleRepeatingContainer.RelativeFilePath, status);
			try
			{
				hxCfgFile.LoadFile(iFileSpec);
			}
			catch (Exception ex3)
			{
				HandleDrawContainerError(ex3.Message, drawContainer);
				drawContainer.Dimensions.Z = RackHelper.GetErrorOrEmptyWellDimension(rack);
				rack.DrawContainers.Add(rack.SingleRepeatingContainer.RelativeFilePath, drawContainer);
			}
			if (drawContainer.FileStatus == FileOpeningStatus.SuccessfullyOpened)
			{
				hxCfgFile.LookupDataDefValueAsShort(iDataDefName, iInstanceName, $"{1}.Shape", out poValue);
				switch ((Shape)poValue)
				{
				case Shape.Cylinder:
				case Shape.RoundBase:
				case Shape.VConeBase:
					hxCfgFile.LookupDataDefValueAsDouble(iDataDefName, iInstanceName, $"{1}.DZ", out poValue2);
					drawContainer.Dimensions.Z = poValue2;
					drawContainer.Shape = Shape.Cylinder;
					break;
				case Shape.Rectangle:
					hxCfgFile.LookupDataDefValueAsDouble(iDataDefName, iInstanceName, $"{1}.DX", out poValue2);
					drawContainer.Dimensions.X = poValue2;
					hxCfgFile.LookupDataDefValueAsDouble(iDataDefName, iInstanceName, $"{1}.DY", out poValue2);
					drawContainer.Dimensions.Y = poValue2;
					drawContainer.Shape = Shape.Rectangle;
					break;
				default:
					hxCfgFile.LookupDataDefValueAsDouble(iDataDefName, iInstanceName, $"{1}.DX", out poValue2);
					drawContainer.Dimensions.Z = poValue2;
					drawContainer.Shape = Shape.Cylinder;
					break;
				}
				rack.DrawContainers.Add(rack.SingleRepeatingContainer.RelativeFilePath, drawContainer);
			}
			return;
		}
		foreach (RackWell rackWell in rack.RackWells)
		{
			if ((string.IsNullOrWhiteSpace(rackWell.ContainerRelativeFilePath) && string.IsNullOrWhiteSpace(rackWell.ContainerFilePath)) || rack.DrawContainers.ContainsKey(rackWell.ContainerRelativeFilePath))
			{
				continue;
			}
			string text = "";
			if (string.IsNullOrEmpty(directoryName))
			{
				text = rackWell.ContainerRelativeFilePath;
			}
			else
			{
				string text5 = Path.Combine(directoryName, rackWell.ContainerRelativeFilePath);
				try
				{
					text = Path.GetFullPath(text5);
				}
				catch (Exception)
				{
					text = text5;
				}
			}
			bool flag = ConfigSharedHelpers.GetRelativeToParent(text, rack.LabwareFileFullPath, HxRegHelper.LabwarePath) == rackWell.ContainerRelativeFilePath;
			string text3;
			if (Path.IsPathRooted(rackWell.ContainerFilePath) && !string.IsNullOrEmpty(Path.GetPathRoot(rackWell.ContainerFilePath)))
			{
				text3 = rackWell.ContainerFilePath;
			}
			else
			{
				string text6 = Path.Combine(HxRegHelper.LabwarePath, rackWell.ContainerFilePath);
				try
				{
					text3 = Path.GetFullPath(text6);
				}
				catch (Exception)
				{
					text3 = text6;
				}
			}
			bool flag2 = Path.GetExtension(text) == ".ctr" && Path.GetExtension(text3) == ".ctr";
			bool flag3 = flag && File.Exists(text);
			bool flag4 = File.Exists(text3);
			DrawContainer drawContainer;
			if (!flag2 || (!flag3 && !flag4))
			{
				drawContainer = new DrawContainer(rackWell.ContainerFilePath, rackWell.ContainerRelativeFilePath, AssignedLabwareStatus.NotFound);
				drawContainer.Dimensions.Z = RackHelper.GetErrorOrEmptyWellDimension(rack);
				rack.DrawContainers.Add(rackWell.ContainerRelativeFilePath, drawContainer);
				continue;
			}
			AssignedLabwareStatus status;
			string iFileSpec;
			if (flag3 && !string.IsNullOrEmpty(rack.LabwareFileFullPath))
			{
				status = AssignedLabwareStatus.FoundUsingRelativePath;
				iFileSpec = text;
			}
			else
			{
				status = AssignedLabwareStatus.FoundUsingAbsolutePath;
				iFileSpec = text3;
			}
			drawContainer = new DrawContainer(rackWell.ContainerFilePath, rackWell.ContainerRelativeFilePath, status);
			try
			{
				hxCfgFile.LoadFile(iFileSpec);
			}
			catch (Exception ex6)
			{
				HandleDrawContainerError(ex6.Message, drawContainer);
				drawContainer.Dimensions.Z = RackHelper.GetErrorOrEmptyWellDimension(rack);
				rack.DrawContainers.Add(rackWell.ContainerRelativeFilePath, drawContainer);
			}
			if (drawContainer.FileStatus == FileOpeningStatus.SuccessfullyOpened)
			{
				hxCfgFile.LookupDataDefValueAsShort(iDataDefName, iInstanceName, $"{1}.Shape", out poValue);
				switch ((Shape)poValue)
				{
				case Shape.Cylinder:
				case Shape.RoundBase:
				case Shape.VConeBase:
					hxCfgFile.LookupDataDefValueAsDouble(iDataDefName, iInstanceName, $"{1}.DZ", out poValue2);
					drawContainer.Dimensions.Z = poValue2;
					drawContainer.Shape = Shape.Cylinder;
					break;
				case Shape.Rectangle:
					hxCfgFile.LookupDataDefValueAsDouble(iDataDefName, iInstanceName, $"{1}.DX", out poValue2);
					drawContainer.Dimensions.X = poValue2;
					hxCfgFile.LookupDataDefValueAsDouble(iDataDefName, iInstanceName, $"{1}.DY", out poValue2);
					drawContainer.Dimensions.Y = poValue2;
					drawContainer.Shape = Shape.Rectangle;
					break;
				default:
					hxCfgFile.LookupDataDefValueAsDouble(iDataDefName, iInstanceName, $"{1}.DX", out poValue2);
					drawContainer.Dimensions.Z = poValue2;
					drawContainer.Shape = Shape.Cylinder;
					break;
				}
				rack.DrawContainers.Add(rackWell.ContainerRelativeFilePath, drawContainer);
			}
		}
	}

	public static void UpdateTemplateAssignedRackStatus(Template template)
	{
		if (template == null || template.Sites == null || template.Sites.Count <= 0)
		{
			return;
		}
		string directoryName = Path.GetDirectoryName(template.LabwareFileFullPath);
		template.AssignedRackStatus = new Dictionary<string, AssignedLabwareStatus>();
		foreach (Site site in template.Sites)
		{
			if ((string.IsNullOrWhiteSpace(site.Labware) && string.IsNullOrWhiteSpace(site.LabwareRelative)) || template.AssignedRackStatus.ContainsKey(site.LabwareRelative))
			{
				continue;
			}
			PathHelper.GenerateNewRelativePath(site.Labware, site.LabwareRelative, template.LabwareFileFullPath);
			_ = string.Empty;
			string text;
			if (string.IsNullOrEmpty(directoryName))
			{
				text = site.LabwareRelative;
			}
			else if (Path.IsPathRooted(site.Labware) && Path.GetPathRoot(site.Labware) != Path.GetPathRoot(directoryName))
			{
				text = site.Labware;
			}
			else
			{
				string text2 = Path.Combine(directoryName, site.LabwareRelative);
				try
				{
					text = Path.GetFullPath(text2);
				}
				catch (Exception)
				{
					text = text2;
				}
			}
			bool flag = ConfigSharedHelpers.GetRelativeToParent(text, template.LabwareFileFullPath, HxRegHelper.LabwarePath) == site.LabwareRelative;
			string path;
			if (Path.IsPathRooted(site.Labware) && !string.IsNullOrEmpty(Path.GetPathRoot(site.Labware)))
			{
				path = site.Labware;
			}
			else
			{
				string text3 = Path.Combine(HxRegHelper.LabwarePath, site.Labware);
				try
				{
					path = Path.GetFullPath(text3);
				}
				catch (Exception)
				{
					path = text3;
				}
			}
			bool flag2 = (Path.GetExtension(text) == ".rck" && Path.GetExtension(path) == ".rck") || (Path.GetExtension(text) == ".crk" && Path.GetExtension(path) == ".crk");
			bool num = flag && File.Exists(text);
			bool flag3 = File.Exists(path);
			if (num && flag2)
			{
				template.AssignedRackStatus.Add(site.LabwareRelative, AssignedLabwareStatus.FoundUsingRelativePath);
			}
			else if (flag3 && flag2)
			{
				template.AssignedRackStatus.Add(site.LabwareRelative, AssignedLabwareStatus.FoundUsingAbsolutePath);
			}
			else
			{
				template.AssignedRackStatus.Add(site.LabwareRelative, AssignedLabwareStatus.NotFound);
			}
		}
	}

	public static List<CategoryNodeData> ReadCategoryFile(string categoryFileFullPath)
	{
		string[] array = File.ReadAllText(categoryFileFullPath).Split(new string[2] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries);
		CategoryNodeData.SetNextAvailableIdAndGuid(int.Parse(array[0]), array[1]);
		List<CategoryNodeData> list = new List<CategoryNodeData>();
		for (int i = 2; i < array.Length; i++)
		{
			string[] array2 = Regex.Split(array[i], "(?<!\\\\),");
			string empty = string.Empty;
			try
			{
				empty = array2[3].Replace("\\,", ",");
			}
			catch
			{
				empty = "default.bmp";
			}
			int id = Convert.ToInt32(array2[0]);
			string viewName = array2[2].Replace("\\,", ",");
			int parentId = Convert.ToInt32(array2[1]);
			list.Add(new CategoryNodeData(id, viewName, parentId, empty));
		}
		return list;
	}

	public static List<LabwareNodeData> ReadAllLabwareNodeData(string labwareFolderPath)
	{
		AccessRight currentAccessRight = HxSecurityComHelper.CurrentAccessRight;
		bool fileProtection = HxRegHelper.FileProtection;
		bool functionProtection = HxRegHelper.FunctionProtection;
		List<string> list = (from s in Directory.GetFiles(labwareFolderPath, "*.*", SearchOption.AllDirectories)
			where s.EndsWith(".crk") || s.EndsWith(".rck") || s.EndsWith(".tml")
			select s).ToList();
		HxCfgFile hxCfgFile = new HxCfgFileClass();
		List<LabwareNodeData> list2 = new List<LabwareNodeData>();
		foreach (string item in list)
		{
			Path.GetFileName(item);
			string extension = Path.GetExtension(item);
			string iDataDefName = ((extension == ".rck") ? "RECTRACK" : ((!(extension == ".tml")) ? "CIRCRACK" : "TEMPLATE"));
			try
			{
				hxCfgFile.LoadFile(item);
			}
			catch (Exception)
			{
				continue;
			}
			bool flag = false;
			FileValidation fileValidation = FileValidation.Invalid;
			List<int> list3 = new List<int>();
			string poValue;
			string name = ((hxCfgFile.LookupDataDefValueAsString(iDataDefName, "default", "ViewName", out poValue) == 0) ? string.Empty : poValue);
			string description = ((hxCfgFile.LookupDataDefValueAsString(iDataDefName, "default", "Description", out poValue) == 0) ? string.Empty : poValue);
			string imagePath;
			if (hxCfgFile.LookupDataDefValueAsString(iDataDefName, "default", "Image3D", out poValue) != 0)
			{
				if (Path.IsPathRooted(poValue))
				{
					imagePath = poValue;
				}
				else
				{
					try
					{
						imagePath = Path.GetFullPath(poValue);
					}
					catch (Exception)
					{
						imagePath = string.Empty;
					}
				}
			}
			else
			{
				imagePath = string.Empty;
			}
			if (hxCfgFile.LookupDataDefValueAsShort(iDataDefName, "default", "CategoryCnt", out var poValue2) != 0 && poValue2 > 0)
			{
				for (int num = 0; num < poValue2; num++)
				{
					string iVariableName = $"Category.{num}.Id";
					if (hxCfgFile.LookupDataDefValueAsLong(iDataDefName, "default", iVariableName, out var poValue3) != 0)
					{
						list3.Add(poValue3);
					}
				}
			}
			fileValidation = HxSecurityComHelper.GetFileValidation(item);
			if (hxCfgFile.LookupDataDefValueAsShort(iDataDefName, "default", "ReadOnly", out poValue2) != 0)
			{
				flag = poValue2 != 0;
			}
			bool isReadOnly = new FileInfo(item).IsReadOnly;
			bool readOnly = (((functionProtection && (currentAccessRight == AccessRight.Operator || currentAccessRight == AccessRight.Operator2)) || (fileProtection && flag) || isReadOnly) ? true : false);
			list2.Add(new LabwareNodeData(name, description, list3, imagePath, item, readOnly, fileValidation));
		}
		hxCfgFile = null;
		return list2;
	}

	public static bool ReadLabwareFilterConfig(out string currentFilterName)
	{
		bool flag = false;
		currentFilterName = null;
		try
		{
			HxCfgFileClass hxCfgFileClass = new HxCfgFileClass();
			string iDataDefName = "LABWAREFILTERING";
			string iInstanceName = "default";
			string text = HxRegHelper.ConfigPath + "\\Labware Filtering\\LabwareFiltering.cfg";
			if (File.Exists(text))
			{
				hxCfgFileClass.LoadFile(text);
				if (hxCfgFileClass.LookupDataDefValueAsShort(iDataDefName, iInstanceName, "LabwareFilteringEnabled", out var poValue) != 0)
				{
					flag = poValue == 1;
				}
				if (flag)
				{
					if (hxCfgFileClass.LookupDataDefValueAsString(iDataDefName, iInstanceName, "CurrentFilterName", out var poValue2) != 0)
					{
						currentFilterName = poValue2;
					}
					else
					{
						currentFilterName = "Default";
					}
				}
			}
			else
			{
				flag = false;
			}
			hxCfgFileClass = null;
			return flag;
		}
		catch (Exception)
		{
			return false;
		}
	}

	public static Dictionary<string, List<LabwareIndexData>> ReadAllLabwareFilters()
	{
		Dictionary<string, List<LabwareIndexData>> dictionary = new Dictionary<string, List<LabwareIndexData>>();
		foreach (string item in (from s in Directory.GetFiles(HxRegHelper.ConfigPath + "\\Labware Filtering\\", "*.*", SearchOption.AllDirectories)
			where s.EndsWith(".dat")
			select s).ToList().OrderBy(Path.GetFileName, StringComparer.InvariantCultureIgnoreCase).ToList())
		{
			dictionary.Add(Path.GetFileNameWithoutExtension(item), ReadLabwareFilter(item));
		}
		return dictionary;
	}

	private static void ReadLabware(Labware labware, string filePath, string dataDef, string dataInstance, short dataVersion)
	{
		HxCfgFile hxCfgFile = new HxCfgFileClass();
		hxCfgFile.LoadFile(filePath);
		short dataDefVerNum = hxCfgFile.GetDataDefVerNum(dataDef, dataInstance);
		if (dataVersion != 0)
		{
		}
		if (hxCfgFile.LookupDataDefValueAsString(dataDef, dataInstance, "Bitmap", out var poValue) != 0)
		{
			labware.Bitmap = poValue;
		}
		if (hxCfgFile.LookupDataDefValueAsString(dataDef, dataInstance, "Image3D", out poValue) != 0)
		{
			labware.Image = poValue;
		}
		double poValue2;
		if (hxCfgFile.LookupDataDefValueAsString(dataDef, dataInstance, "3DModel", out poValue) != 0 && !string.IsNullOrEmpty(poValue))
		{
			labware.Model = poValue;
			if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, "3DxOffset", out poValue2) != 0)
			{
				labware.ModelOffsets.X = poValue2;
			}
			if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, "3DyOffset", out poValue2) != 0)
			{
				labware.ModelOffsets.Y = poValue2;
			}
			if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, "3DzOffset", out poValue2) != 0)
			{
				labware.ModelOffsets.Z = poValue2;
			}
		}
		if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, "Dim.Dx", out poValue2) != 0)
		{
			labware.Dimensions.X = poValue2;
		}
		if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, "Dim.Dy", out poValue2) != 0)
		{
			labware.Dimensions.Y = poValue2;
		}
		if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, "Dim.Dz", out poValue2) != 0)
		{
			labware.Dimensions.Z = poValue2;
		}
		if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, "Clearance", out poValue2) == 0)
		{
			labware.Clearance = labware.Dimensions.Z;
		}
		else
		{
			labware.Clearance = poValue2;
		}
		if (hxCfgFile.LookupDataDefValueAsShort(dataDef, dataInstance, "UseBndry", out var poValue3) != 0)
		{
			labware.UseBoundary = poValue3 != 0;
		}
		if (labware.UseBoundary)
		{
			if (hxCfgFile.LookupDataDefValueAsShort(dataDef, dataInstance, "Shape", out poValue3) != 0)
			{
				labware.BoundaryShape = (Shape)poValue3;
			}
			if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, "BndryX", out poValue2) != 0)
			{
				labware.BoundaryOffsets.X = poValue2;
			}
			if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, "BndryY", out poValue2) != 0)
			{
				labware.BoundaryOffsets.Y = poValue2;
			}
		}
		int poValue4;
		if (hxCfgFile.LookupDataDefValueAsShort(dataDef, dataInstance, "CategoryCnt", out poValue3) != 0 && poValue3 > 0)
		{
			for (int i = 0; i < poValue3; i++)
			{
				string iVariableName = $"Category.{i}.Id";
				if (hxCfgFile.LookupDataDefValueAsLong(dataDef, dataInstance, iVariableName, out poValue4) != 0)
				{
					labware.CategoryIds.Add(poValue4);
				}
			}
		}
		if (hxCfgFile.LookupDataDefValueAsString(dataDef, dataInstance, "ViewName", out poValue) != 0)
		{
			labware.Name = poValue;
		}
		if (hxCfgFile.LookupDataDefValueAsString(dataDef, dataInstance, "Description", out poValue) != 0)
		{
			labware.Description = poValue;
		}
		if (hxCfgFile.LookupDataDefValueAsShort(dataDef, dataInstance, "Visible", out poValue3) != 0)
		{
			labware.Visible = poValue3 != 0;
		}
		if (hxCfgFile.LookupDataDefValueAsString(dataDef, dataInstance, "Barcode.Value", out poValue) != 0)
		{
			labware.Barcode = poValue;
		}
		if (hxCfgFile.LookupDataDefValueAsShort(dataDef, dataInstance, "Barcode.Unique", out poValue3) != 0)
		{
			labware.BarcodeIsUnique = poValue3 != 0;
		}
		if (hxCfgFile.LookupDataDefValueAsLong(dataDef, dataInstance, "PropertyCnt", out poValue4) != 0 && poValue4 > 0)
		{
			for (int j = 0; j < poValue4; j++)
			{
				Property property = new Property();
				string iVariableName = $"Property.{j + 1}";
				if (hxCfgFile.LookupDataDefValueAsString(dataDef, dataInstance, iVariableName, out poValue) != 0)
				{
					property.Name = poValue;
				}
				iVariableName = $"PropertyValue.{j + 1}";
				if (hxCfgFile.LookupDataDefValueAsString(dataDef, dataInstance, iVariableName, out poValue) != 0)
				{
					property.Value = poValue;
				}
				labware.Properties.Add(property);
			}
		}
		if (hxCfgFile.LookupDataDefValueAsShort(dataDef, dataInstance, "ReadOnly", out poValue3) != 0)
		{
			labware.IsHamiltonOriginalLabware = poValue3 != 0;
		}
		FileInfo fileInfo = new FileInfo(filePath);
		labware.FileIsReadOnly = fileInfo.IsReadOnly;
		labware.LabwareFileFullPath = filePath;
		hxCfgFile = null;
	}

	private static void ReadTemplate(Template template, string filePath, string dataDef, string dataInstance, short dataVersion)
	{
		HxCfgFile hxCfgFile = new HxCfgFileClass();
		hxCfgFile.LoadFile(filePath);
		if (hxCfgFile.LookupDataDefValueAsLong(dataDef, dataInstance, "BackgrndClr", out var poValue) != 0)
		{
			template.BackgroundColor = ColorHelper.VectorLabwareColorIntToColor(poValue);
		}
		else
		{
			template.BackgroundColor = Color.FromArgb(255, 255, 255, 255);
		}
		if (hxCfgFile.LookupDataDefValueAsShort(dataDef, dataInstance, "Site.Cnt", out var poValue2) != 0 && poValue2 > 0)
		{
			int num = poValue2;
			int num2 = 1;
			int num3 = 0;
			while (num3 < num)
			{
				Site site = new Site();
				if (hxCfgFile.LookupDataDefValueAsString(dataDef, dataInstance, $"Site.{num2.ToString()}.LabwareFile", out var poValue3) != 0)
				{
					site.Labware = poValue3;
				}
				if (hxCfgFile.LookupDataDefValueAsString(dataDef, dataInstance, $"Site.{num2.ToString()}.LabwareFileRel", out poValue3) != 0)
				{
					site.LabwareRelative = poValue3;
				}
				else
				{
					string qualifiedPath = ConfigSharedHelpers.GetQualifiedPath(site.Labware, template.LabwareFileFullPath, HxRegHelper.LabwarePath);
					site.LabwareRelative = ConfigSharedHelpers.GetRelativeToParent(qualifiedPath, template.LabwareFileFullPath, HxRegHelper.LabwarePath);
				}
				if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, $"Site.{num2.ToString()}.Dx", out var poValue4) != 0)
				{
					site.Dimensions.X = poValue4;
				}
				if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, $"Site.{num2.ToString()}.Dy", out poValue4) != 0)
				{
					site.Dimensions.Y = poValue4;
				}
				if (hxCfgFile.LookupDataDefValueAsString(dataDef, dataInstance, $"Site.{num2.ToString()}.Id", out poValue3) != 0)
				{
					site.Id = poValue3;
				}
				if (hxCfgFile.LookupDataDefValueAsShort(dataDef, dataInstance, $"Site.{num2.ToString()}.IsCovered", out poValue2) != 0)
				{
					site.IsCovered = poValue2 != 0;
				}
				if (hxCfgFile.LookupDataDefValueAsShort(dataDef, dataInstance, $"Site.{num2.ToString()}.Label", out poValue2) != 0)
				{
					site.Label = poValue2 != 0;
				}
				if (hxCfgFile.LookupDataDefValueAsShort(dataDef, dataInstance, $"Site.{num2.ToString()}.Posn", out poValue2) != 0)
				{
					site.Position = poValue2;
				}
				if (hxCfgFile.LookupDataDefValueAsShort(dataDef, dataInstance, $"Site.{num2.ToString()}.SnapBase", out poValue2) != 0)
				{
					site.SnapBase = poValue2 != 0;
				}
				if (hxCfgFile.LookupDataDefValueAsShort(dataDef, dataInstance, $"Site.{num2.ToString()}.Stack", out poValue2) != 0)
				{
					site.IsStack = poValue2 != 0;
				}
				if (hxCfgFile.LookupDataDefValueAsShort(dataDef, dataInstance, $"Site.{num2.ToString()}.StackSize", out poValue2) != 0)
				{
					site.StackSize = poValue2;
				}
				if (hxCfgFile.LookupDataDefValueAsShort(dataDef, dataInstance, $"Site.{num2.ToString()}.Visible", out poValue2) != 0)
				{
					site.Visible = poValue2 != 0;
				}
				if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, $"Site.{num2.ToString()}.X", out poValue4) != 0)
				{
					site.OffsetsToParentOrigin.X = poValue4;
				}
				if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, $"Site.{num2.ToString()}.Y", out poValue4) != 0)
				{
					site.OffsetsToParentOrigin.Y = poValue4;
				}
				if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, $"Site.{num2.ToString()}.Z", out poValue4) != 0)
				{
					site.OffsetsToParentOrigin.Z = poValue4;
				}
				template.Sites.Add(site);
				num3++;
				num2++;
			}
			template.Sites = new TrulyObservableCollection<Site>((from x in template.Sites.AsQueryable()
				orderby x.Position
				select x).ToList());
		}
		if (template.Sites.Count != 0)
		{
			UpdateTemplateAssignedRackStatus(template);
		}
		hxCfgFile = null;
	}

	private static void ReadRectangularRack(RectangularRack rectangularRack, string filePath, string dataDef, string dataInstance, short dataVersion)
	{
		ReadRack(rectangularRack, filePath, dataDef, dataInstance, dataVersion);
		HxCfgFile hxCfgFile = new HxCfgFileClass();
		hxCfgFile.LoadFile(filePath);
		double poValue2;
		if (hxCfgFile.LookupDataDefValueAsLong(dataDef, dataInstance, "SegmentCount_x", out var poValue) != 0 && poValue > 0)
		{
			int num = poValue;
			for (int i = 0; i < num; i++)
			{
				GripSegment gripSegment = new GripSegment();
				if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, $"Seg_x.{i}.SegmentHeight", out poValue2) != 0)
				{
					gripSegment.Height = poValue2;
				}
				if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, $"Seg_x.{i}.LowerWidth", out poValue2) != 0)
				{
					gripSegment.LowerWidth = poValue2;
				}
				if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, $"Seg_x.{i}.UpperWidth", out poValue2) != 0)
				{
					gripSegment.UpperWidth = poValue2;
				}
				rectangularRack.GripSegmentsX.Add(gripSegment);
			}
		}
		if (hxCfgFile.LookupDataDefValueAsLong(dataDef, dataInstance, "SegmentCount_y", out poValue) != 0 && poValue > 0)
		{
			int num2 = poValue;
			for (int j = 0; j < num2; j++)
			{
				GripSegment gripSegment2 = new GripSegment();
				if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, $"Seg_y.{j}.SegmentHeight", out poValue2) != 0)
				{
					gripSegment2.Height = poValue2;
				}
				if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, $"Seg_y.{j}.LowerWidth", out poValue2) != 0)
				{
					gripSegment2.LowerWidth = poValue2;
				}
				if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, $"Seg_y.{j}.UpperWidth", out poValue2) != 0)
				{
					gripSegment2.UpperWidth = poValue2;
				}
				rectangularRack.GripSegmentsY.Add(gripSegment2);
			}
		}
		if (rectangularRack.GripSegmentsX.Count > 0 || rectangularRack.GripSegmentsY.Count > 0)
		{
			rectangularRack.UseGripSegments = true;
		}
		if (hxCfgFile.LookupDataDefValueAsShort(dataDef, dataInstance, "IX.Start", out var poValue3) != 0)
		{
			rectangularRack.RectangularDefaultSequence.StartCorner = ((poValue3 == 0) ? Corner.BackLeft : Corner.FrontLeft);
		}
		if (hxCfgFile.LookupDataDefValueAsShort(dataDef, dataInstance, "IX.Inc", out poValue3) != 0)
		{
			rectangularRack.RectangularDefaultSequence.IncrementDirection = ((poValue3 == 0) ? IncrementDirection.RowFirst : IncrementDirection.ColumnFirst);
		}
		if (hxCfgFile.LookupDataDefValueAsShort(dataDef, dataInstance, "IX.Index", out poValue3) != 0)
		{
			rectangularRack.RectangularDefaultSequence.UseDefaultStartValue = poValue3 != 0;
		}
		if (hxCfgFile.LookupDataDefValueAsLong(dataDef, dataInstance, "IX.First", out poValue) != 0)
		{
			rectangularRack.RectangularDefaultSequence.UserStartValue = poValue;
		}
		if (hxCfgFile.LookupDataDefValueAsShort(dataDef, dataInstance, "DataType", out poValue3) != 0)
		{
			rectangularRack.LegacyDataType = (LegacyDataType)poValue3;
		}
		List<IrregularWell> list = new List<IrregularWell>();
		string poValue4;
		if (rectangularRack.LegacyDataType == LegacyDataType.IrregularRack)
		{
			if (hxCfgFile.LookupDataDefValueAsLong(dataDef, dataInstance, "HoleCnt", out poValue) != 0)
			{
				rectangularRack.IrregularWellUserCount = poValue;
			}
			rectangularRack.WellPattern = WellPattern.Irregular;
			for (int k = 1; k <= rectangularRack.IrregularWellUserCount; k++)
			{
				IrregularWell irregularWell = new IrregularWell();
				if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, $"{k}.X", out poValue2) != 0)
				{
					irregularWell.CenterX = poValue2;
				}
				if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, $"{k}.Y", out poValue2) != 0)
				{
					irregularWell.CenterY = poValue2;
				}
				if (hxCfgFile.LookupDataDefValueAsString(dataDef, dataInstance, $"{k}.ID", out poValue4) != 0)
				{
					irregularWell.PositionLable = poValue4;
				}
				list.Add(irregularWell);
			}
			rectangularRack.Rows = 8;
			rectangularRack.Columns = 12;
			rectangularRack.RowSpacing = 9.0;
			rectangularRack.ColumnSpacing = 9.0;
		}
		else
		{
			if (hxCfgFile.LookupDataDefValueAsShort(dataDef, dataInstance, "Rows", out poValue3) != 0)
			{
				rectangularRack.Rows = poValue3;
			}
			if (hxCfgFile.LookupDataDefValueAsShort(dataDef, dataInstance, "Columns", out poValue3) != 0)
			{
				rectangularRack.Columns = poValue3;
			}
			if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, "Dx", out poValue2) != 0)
			{
				rectangularRack.ColumnSpacing = poValue2;
			}
			if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, "Dy", out poValue2) != 0)
			{
				rectangularRack.RowSpacing = poValue2;
			}
			if (rectangularRack.LegacyDataType == LegacyDataType.MTPPortrait || rectangularRack.LegacyDataType == LegacyDataType.MTPLandscape)
			{
				if (rectangularRack.Rows == 8 && rectangularRack.Columns == 12)
				{
					rectangularRack.Orientation = Orientation.Landscape;
					rectangularRack.WellPattern = WellPattern.Standard96Plate;
				}
				else if (rectangularRack.Rows == 16 && rectangularRack.Columns == 24)
				{
					rectangularRack.Orientation = Orientation.Landscape;
					rectangularRack.WellPattern = WellPattern.Standard384Plate;
				}
				else if (rectangularRack.Rows == 32 && rectangularRack.Columns == 48)
				{
					rectangularRack.Orientation = Orientation.Landscape;
					rectangularRack.WellPattern = WellPattern.Standard1536Plate;
				}
				else if (rectangularRack.Rows == 12 && rectangularRack.Columns == 8)
				{
					rectangularRack.Orientation = Orientation.Portrait;
					rectangularRack.WellPattern = WellPattern.Standard96Plate;
				}
				else if (rectangularRack.Rows == 24 && rectangularRack.Columns == 16)
				{
					rectangularRack.Orientation = Orientation.Portrait;
					rectangularRack.WellPattern = WellPattern.Standard384Plate;
				}
				else if (rectangularRack.Rows == 48 && rectangularRack.Columns == 32)
				{
					rectangularRack.Orientation = Orientation.Portrait;
					rectangularRack.WellPattern = WellPattern.Standard1536Plate;
				}
			}
			else
			{
				rectangularRack.WellPattern = WellPattern.Regular;
				if (hxCfgFile.LookupDataDefValueAsShort(dataDef, dataInstance, "Options", out poValue3) != 0 && poValue3 != 0)
				{
					rectangularRack.Stagger.Enabled = true;
					if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, "Stagger", out poValue2) != 0)
					{
						rectangularRack.Stagger.OffsetValue = poValue2;
					}
					switch (poValue3)
					{
					case 1:
						rectangularRack.Stagger.OffsetDirection = OffsetDirection.In;
						break;
					case 2:
						rectangularRack.Stagger.OffsetDirection = OffsetDirection.Out;
						break;
					}
				}
			}
		}
		List<RackContainer> list2 = new List<RackContainer>();
		bool flag = false;
		if (hxCfgFile.LookupDataDefValueAsShort(dataDef, dataInstance, "SingleCntr", out poValue3) != 0)
		{
			flag = poValue3 != 0;
		}
		RackContainer rackContainer = null;
		if (flag)
		{
			rectangularRack.ContainerLayout = ContainerLayout.SingleContainer;
			rackContainer = new RackContainer();
			if (hxCfgFile.LookupDataDefValueAsString(dataDef, dataInstance, $"Cntr.{1}.posn", out poValue4) != 0)
			{
				rackContainer.WellPositionLabel = poValue4;
			}
			if (hxCfgFile.LookupDataDefValueAsString(dataDef, dataInstance, $"Cntr.{1}.file", out poValue4) != 0)
			{
				rackContainer.FilePath = poValue4;
			}
			if (hxCfgFile.LookupDataDefValueAsString(dataDef, dataInstance, $"Cntr.{1}.fileRel", out poValue4) != 0)
			{
				rackContainer.RelativeFilePath = poValue4;
			}
			else
			{
				string qualifiedPath = ConfigSharedHelpers.GetQualifiedPath(rackContainer.FilePath, rectangularRack.LabwareFileFullPath, HxRegHelper.LabwarePath);
				rackContainer.RelativeFilePath = ConfigSharedHelpers.GetRelativeToParent(qualifiedPath, rectangularRack.LabwareFileFullPath, HxRegHelper.LabwarePath);
			}
			if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, $"Cntr.{1}.base", out poValue2) != 0)
			{
				rackContainer.Offsets.Z = poValue2;
			}
			if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, $"Cntr.{1}.offsetx", out poValue2) != 0)
			{
				rackContainer.Offsets.X = poValue2;
			}
			if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, $"Cntr.{1}.offsety", out poValue2) != 0)
			{
				rackContainer.Offsets.Y = poValue2;
			}
			list2.Add(rackContainer);
			rectangularRack.SingleRepeatingContainer = new RackContainer(rackContainer);
		}
		else if (rectangularRack.NumberOfContainers == 0)
		{
			rectangularRack.ContainerLayout = ContainerLayout.WellsOnly;
			if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, "Hole.Z", out poValue2) != 0)
			{
				rectangularRack.WellDiameter = poValue2;
			}
			rectangularRack.SingleRepeatingContainer = new RackContainer();
		}
		else
		{
			rectangularRack.ContainerLayout = ContainerLayout.MultipleContainers;
			Dictionary<string, string> dictionary = new Dictionary<string, string>();
			for (int l = 1; l <= rectangularRack.NumberOfContainers; l++)
			{
				rackContainer = new RackContainer();
				if (hxCfgFile.LookupDataDefValueAsString(dataDef, dataInstance, $"Cntr.{l}.posn", out poValue4) != 0)
				{
					rackContainer.WellPositionLabel = poValue4;
				}
				if (hxCfgFile.LookupDataDefValueAsString(dataDef, dataInstance, $"Cntr.{l}.file", out poValue4) != 0)
				{
					rackContainer.FilePath = poValue4;
				}
				if (hxCfgFile.LookupDataDefValueAsString(dataDef, dataInstance, $"Cntr.{l}.fileRel", out poValue4) != 0)
				{
					rackContainer.RelativeFilePath = poValue4;
				}
				else if (!string.IsNullOrEmpty(rackContainer.FilePath))
				{
					if (dictionary.TryGetValue(rackContainer.FilePath, out var value))
					{
						rackContainer.RelativeFilePath = value;
					}
					else
					{
						string qualifiedPath2 = ConfigSharedHelpers.GetQualifiedPath(rackContainer.FilePath, rectangularRack.LabwareFileFullPath, HxRegHelper.LabwarePath);
						rackContainer.RelativeFilePath = ConfigSharedHelpers.GetRelativeToParent(qualifiedPath2, rectangularRack.LabwareFileFullPath, HxRegHelper.LabwarePath);
						dictionary.Add(rackContainer.FilePath, rackContainer.RelativeFilePath);
					}
				}
				if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, $"Cntr.{l}.base", out poValue2) != 0)
				{
					rackContainer.Offsets.Z = poValue2;
				}
				if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, $"Cntr.{l}.offsetx", out poValue2) != 0)
				{
					rackContainer.Offsets.X = poValue2;
				}
				if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, $"Cntr.{l}.offsety", out poValue2) != 0)
				{
					rackContainer.Offsets.Y = poValue2;
				}
				list2.Add(rackContainer);
			}
			dictionary = null;
			rectangularRack.SingleRepeatingContainer = new RackContainer(list2[0]);
		}
		rectangularRack.GenerateRackWells(list, list2);
		if (rectangularRack.NumberOfContainers != 0 || flag)
		{
			UpdateRackDrawContainers(rectangularRack);
		}
		if (!rectangularRack.UseBoundary)
		{
			rectangularRack.UseBoundary = true;
			if (rectangularRack.WellPattern == WellPattern.Regular || rectangularRack.WellPattern == WellPattern.Irregular)
			{
				double maxX = 0.0;
				double minX = 0.0;
				double maxY = 0.0;
				double minY = 0.0;
				rectangularRack.Dimensions.X = 0.0;
				rectangularRack.Dimensions.Y = 0.0;
				rectangularRack.BoundaryOffsets.X = 0.0;
				rectangularRack.BoundaryOffsets.Y = 0.0;
				RackHelper.GetRectangularBoundaryContainerEdges(rectangularRack, out minX, out maxX, out minY, out maxY);
				rectangularRack.Dimensions.X = Math.Abs(minX) + Math.Abs(maxX);
				rectangularRack.Dimensions.Y = Math.Abs(minY) + Math.Abs(maxY);
				rectangularRack.BoundaryOffsets.X = Math.Abs(minX);
				rectangularRack.BoundaryOffsets.Y = Math.Abs(minY);
				rectangularRack.BoundaryShape = Shape.Rectangle;
			}
			SimpleIoc.Default.GetInstance<LoadedRectangularRackViewModel>();
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"RectangularRackBoundaryCorrectionWarning");
		}
		if ((rectangularRack.WellPattern == WellPattern.Standard96Plate || rectangularRack.WellPattern == WellPattern.Standard384Plate || rectangularRack.WellPattern == WellPattern.Standard1536Plate || rectangularRack.WellPattern == WellPattern.Regular) && rectangularRack.RectangularDefaultSequence.StartCorner == Corner.BackLeft)
		{
			rectangularRack.IrregularRackBoundaryOffsets.Y = rectangularRack.BoundaryOffsets.Y + (double)(rectangularRack.Rows - 1) * rectangularRack.RowSpacing;
		}
		else if (rectangularRack.WellPattern == WellPattern.Irregular)
		{
			rectangularRack.IrregularRackBoundaryOffsets.Y = rectangularRack.BoundaryOffsets.Y;
			rectangularRack.BoundaryOffsets.Y = rectangularRack.IrregularRackBoundaryOffsets.Y - (double)(rectangularRack.Rows - 1) * rectangularRack.RowSpacing;
		}
		else
		{
			rectangularRack.IrregularRackBoundaryOffsets.Y = rectangularRack.BoundaryOffsets.Y;
		}
		rectangularRack.IrregularRackBoundaryOffsets.X = rectangularRack.BoundaryOffsets.X;
	}

	private static void ReadRack(Rack rack, string filePath, string dataDef, string dataInstance, short dataVersion)
	{
		HxCfgFile configFile = new HxCfgFileClass();
		configFile.LoadFile(filePath);
		Func<string, short> lookupShort = delegate(string key)
		{
			try
			{
				return configFile.GetDataDefValueAsShort(dataDef, dataInstance, key);
			}
			catch
			{
				return 0;
			}
		};
		Func<string, double> func = delegate(string key)
		{
			try
			{
				return configFile.GetDataDefValueAsDouble(dataDef, dataInstance, key);
			}
			catch
			{
				return 0.0;
			}
		};
		Func<string, bool> func2 = (string key) => lookupShort(key) == 1;
		rack.NumberOfContainers = lookupShort("CntrCnt");
		rack.ContainersAreConnected = func2("ConnectedCtr");
		rack.StackHeight = func("StackHt");
		rack.Hole.Shape = (Shape)lookupShort("Hole.Shape");
		rack.Hole.Dimensions.X = lookupShort("Hole.X");
		rack.Hole.Dimensions.Y = lookupShort("Hole.Y");
		rack.Hole.Dimensions.Z = lookupShort("Hole.Z");
		string text = Path.Combine(Path.GetDirectoryName(rack.LabwareFileFullPath) + "\\" + Path.GetFileNameWithoutExtension(rack.LabwareFileFullPath) + ".lid");
		if (File.Exists(text))
		{
			rack.Cover = new Cover();
			rack.UseCover = true;
			ReadCover(rack.Cover, text);
			if (rack.Cover.OverriddenExtent.X != rack.Dimensions.X || rack.Cover.OverriddenExtent.Y != rack.Dimensions.Y)
			{
				rack.Cover.OverrideExtent = true;
			}
		}
		if (configFile.LookupDataDefValueAsLong(dataDef, dataInstance, "BackgrndClr", out var poValue) != 0)
		{
			rack.BackgroundColor = ColorHelper.VectorLabwareColorIntToColor(poValue);
		}
		else
		{
			rack.BackgroundColor = Color.FromArgb(255, 255, 255, 255);
		}
	}

	private static List<RackContainer> ReadRackContainers(Rack rack, HxCfgFile configFile, string dataDef, string dataInstance)
	{
		Func<string, short> func = delegate(string key)
		{
			try
			{
				return configFile.GetDataDefValueAsShort(dataDef, dataInstance, key);
			}
			catch
			{
				return 0;
			}
		};
		Func<string, double> func2 = delegate(string key)
		{
			try
			{
				return configFile.GetDataDefValueAsDouble(dataDef, dataInstance, key);
			}
			catch
			{
				return 0.0;
			}
		};
		Func<string, string> func3 = delegate(string key)
		{
			try
			{
				return configFile.GetDataDefValueAsString(dataDef, dataInstance, key);
			}
			catch
			{
				return string.Empty;
			}
		};
		List<RackContainer> list = new List<RackContainer>();
		bool flag = func("SingleCntr") != 0;
		RackContainer rackContainer = new RackContainer();
		int num = (flag ? 1 : rack.NumberOfContainers);
		if (rack.NumberOfContainers == 0 && !flag)
		{
			rack.ContainerLayout = ContainerLayout.WellsOnly;
			rack.WellDiameter = func2("Hole.Z");
			rack.SingleRepeatingContainer = new RackContainer();
			return new List<RackContainer>();
		}
		Dictionary<string, string> dictionary = new Dictionary<string, string>();
		for (int num2 = 1; num2 <= num; num2++)
		{
			rackContainer = new RackContainer
			{
				WellPositionLabel = func3($"Cntr.{num2}.posn"),
				FilePath = func3($"Cntr.{num2}.file"),
				RelativeFilePath = func3($"Cntr.{num2}.fileRel"),
				Offsets = 
				{
					X = func2($"Cntr.{num2}.offsetx"),
					Y = func2($"Cntr.{num2}.offsety"),
					Z = func2($"Cntr.{num2}.base")
				}
			};
			if (string.IsNullOrEmpty(rackContainer.RelativeFilePath) && !string.IsNullOrEmpty(rackContainer.FilePath))
			{
				if (dictionary.TryGetValue(rackContainer.FilePath, out var value))
				{
					rackContainer.RelativeFilePath = value;
				}
				else
				{
					rackContainer.RelativeFilePath = ConfigSharedHelpers.GetRelativeToParent(ConfigSharedHelpers.GetQualifiedPath(rackContainer.FilePath, rack.LabwareFileFullPath, HxRegHelper.LabwarePath), rack.LabwareFileFullPath, HxRegHelper.LabwarePath);
					dictionary.Add(rackContainer.FilePath, rackContainer.RelativeFilePath);
				}
			}
			list.Add(rackContainer);
		}
		rack.ContainerLayout = (flag ? ContainerLayout.SingleContainer : ContainerLayout.MultipleContainers);
		rack.SingleRepeatingContainer = (flag ? new RackContainer(rackContainer) : new RackContainer(list[0]));
		return list;
	}

	private static void ReadCircularRack(CircularRack circularRack, string filePath, string dataDef, string dataInstance, short dataVersion)
	{
		ReadRack(circularRack, filePath, dataDef, dataInstance, dataVersion);
		HxCfgFile configFile = new HxCfgFileClass();
		configFile.LoadFile(filePath);
		Func<string, short> lookupShort = delegate(string key)
		{
			try
			{
				return configFile.GetDataDefValueAsShort(dataDef, dataInstance, key);
			}
			catch
			{
				return 0;
			}
		};
		Func<string, double> lookupDouble = delegate(string key)
		{
			try
			{
				return configFile.GetDataDefValueAsDouble(dataDef, dataInstance, key);
			}
			catch
			{
				return 0.0;
			}
		};
		IEnumerable<int> source = Enumerable.Range(1, lookupShort("Segments"));
		List<CircularRackSegment> segmentList = new List<CircularRackSegment>
		{
			new CircularRackSegment
			{
				HoleCount = lookupShort($"{1}.HoleCnt"),
				Arc = Arc.FromAbsolutePoints(Vector2.FromRectangular(lookupDouble($"{1}.FirstX"), lookupDouble($"{1}.FirstY")), Vector2.FromRectangular(lookupDouble($"{1}.MidX"), lookupDouble($"{1}.MidY")), Vector2.FromRectangular(lookupDouble($"{1}.LastX"), lookupDouble($"{1}.LastY")), clockwiseIsPositive: true)
			}
		};
		List<int> list = source.ToList();
		if (list.Count > 1)
		{
			segmentList.AddRange((from index in list.Skip(1)
				select new CircularRackSegment
				{
					HoleCount = lookupShort($"{index}.HoleCnt"),
					Arc = Arc.FromAbsolutePointsAndCenter(Vector2.FromRectangular(lookupDouble($"{index}.FirstX"), lookupDouble($"{index}.FirstY")), Vector2.FromRectangular(lookupDouble($"{index}.LastX"), lookupDouble($"{index}.LastY")), segmentList.First().Arc.CenterPoint, clockwiseIsPositive: true)
				}).ToList());
		}
		circularRack.Segments.Clear();
		foreach (CircularRackSegment item in segmentList)
		{
			circularRack.Segments.Add(item);
		}
		circularRack.ReadDefaultSequenceData(configFile);
		circularRack.GenerateRackWells(ReadRackContainers(circularRack, configFile, dataDef, dataInstance));
		if (circularRack.NumberOfContainers != 0 || circularRack.ContainerLayout == ContainerLayout.SingleContainer)
		{
			UpdateRackDrawContainers(circularRack);
		}
		if (!circularRack.UseBoundary)
		{
			circularRack.AssignSmallestPossibleBoundary();
			SimpleIoc.Default.GetInstance<LoadedCircularRackViewModel>();
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"CircularRackBoundaryCorrectionWarning");
		}
	}

	private static void ReadContainer(Container container, string filePath, string dataDef, string dataInstance, short dataVersion)
	{
		HxCfgFile hxCfgFile = new HxCfgFileClass();
		hxCfgFile.LoadFile(filePath);
		if (hxCfgFile.LookupDataDefValueAsShort(dataDef, dataInstance, "Shape", out var poValue) != 0)
		{
			container.ApertureShape = (Shape)poValue;
		}
		if (hxCfgFile.LookupDataDefValueAsShort(dataDef, dataInstance, "LS", out poValue) != 0)
		{
			container.LLDData.Enabled = poValue != 0;
		}
		double poValue2;
		if (container.LLDData.Enabled)
		{
			if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, "LSHt", out poValue2) != 0)
			{
				container.LLDData.SeekHeight = poValue2;
			}
			if (hxCfgFile.LookupDataDefValueAsShort(dataDef, dataInstance, "cLLD", out poValue) != 0)
			{
				if (poValue == 5)
				{
					container.LLDData.Sensitivity = Sensitivity.Low;
					SimpleIoc.Default.GetInstance<LoadedContainerViewModel>();
					Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"LLDValueCorrectionWarning");
				}
				else
				{
					container.LLDData.Sensitivity = (Sensitivity)poValue;
				}
			}
			else
			{
				container.LLDData.Sensitivity = Sensitivity.Low;
			}
		}
		if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, "Depth", out poValue2) != 0)
		{
			container.TotalInnerDepth = poValue2;
		}
		if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, "MaxDepth", out poValue2) != 0)
		{
			container.DeadVolumeHeight = poValue2;
		}
		if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, "BaseMM", out poValue2) != 0)
		{
			container.BaseThickness = poValue2;
		}
		if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, "TchBase", out poValue2) != 0)
		{
			container.BottomTouchOffHeight = poValue2;
		}
		if (hxCfgFile.LookupDataDefValueAsShort(dataDef, dataInstance, "TchOff", out poValue) != 0)
		{
			container.WickTouchOffData.Enabled = poValue != 0;
			if (container.WickTouchOffData.Enabled)
			{
				if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, "TchHt", out poValue2) != 0)
				{
					container.WickTouchOffData.Height = poValue2;
				}
				if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, "TchFront", out poValue2) != 0)
				{
					container.WickTouchOffData.Front = poValue2;
				}
				if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, "TchRight", out poValue2) != 0)
				{
					container.WickTouchOffData.Right = poValue2;
				}
				if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, "TchBack", out poValue2) != 0)
				{
					container.WickTouchOffData.Back = poValue2;
				}
				if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, "TchLeft", out poValue2) != 0)
				{
					container.WickTouchOffData.Left = poValue2;
				}
			}
		}
		if (hxCfgFile.LookupDataDefValueAsLong(dataDef, dataInstance, "Segments", out var poValue3) != 0)
		{
			int num = poValue3;
			int num2 = 1;
			int num3 = 0;
			while (num3 < num)
			{
				ContainerSegment containerSegment = null;
				hxCfgFile.LookupDataDefValueAsShort(dataDef, dataInstance, $"{num2}.Shape", out poValue);
				containerSegment = new ContainerSegment((Shape)poValue);
				if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, $"{num2}.Min", out poValue2) != 0)
				{
					containerSegment.MinHeight = poValue2;
				}
				if (hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, $"{num2}.Max", out poValue2) != 0)
				{
					containerSegment.MaxHeight = poValue2;
				}
				LookUpRelevantContainerSegmentDimensions(dataDef, dataInstance, hxCfgFile, ref containerSegment, num2);
				container.Segments.Add(containerSegment);
				num3++;
				num2++;
			}
		}
		foreach (ContainerSegment segment in container.Segments)
		{
			segment.RecalculateHeightAndVolume();
		}
		hxCfgFile = null;
	}

	private static void LookUpRelevantContainerSegmentDimensions(string dataDef, string dataInstance, HxCfgFile hxCfgFile, ref ContainerSegment segment, int segmentNumber)
	{
		double poValue;
		switch (segment.Shape)
		{
		case Shape.Cylinder:
		case Shape.RoundBase:
		case Shape.VConeBase:
			if ((double)hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, $"{segmentNumber}.DZ", out poValue) != 0.0)
			{
				segment.Dz = poValue;
			}
			break;
		case Shape.Rectangle:
		case Shape.InvertedVCone:
		case Shape.VCone:
			if ((double)hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, $"{segmentNumber}.DX", out poValue) != 0.0)
			{
				segment.Dx = poValue;
			}
			if ((double)hxCfgFile.LookupDataDefValueAsDouble(dataDef, dataInstance, $"{segmentNumber}.DY", out poValue) != 0.0)
			{
				segment.Dy = poValue;
			}
			break;
		}
	}

	private static void ReadCover(Cover cover, string coverFullPath)
	{
		HxCfgFile hxCfgFile = new HxCfgFileClass();
		string iDataDefName = "COVER";
		string iInstanceName = "default";
		hxCfgFile.LoadFile(coverFullPath);
		if (hxCfgFile.LookupDataDefValueAsString(iDataDefName, iInstanceName, "ViewName", out var poValue) != 0)
		{
			cover.Name = poValue;
		}
		if (hxCfgFile.LookupDataDefValueAsString(iDataDefName, iInstanceName, "Description", out poValue) != 0)
		{
			cover.Description = poValue;
		}
		if (hxCfgFile.LookupDataDefValueAsString(iDataDefName, iInstanceName, "Bitmap", out poValue) != 0)
		{
			cover.Bitmap = poValue;
		}
		if (hxCfgFile.LookupDataDefValueAsString(iDataDefName, iInstanceName, "Image3D", out poValue) != 0)
		{
			cover.Image = poValue;
		}
		double poValue2;
		if (hxCfgFile.LookupDataDefValueAsString(iDataDefName, iInstanceName, "3DModel", out poValue) != 0 && !string.IsNullOrEmpty(poValue))
		{
			cover.Model = poValue;
			if (hxCfgFile.LookupDataDefValueAsDouble(iDataDefName, iInstanceName, "3DxOffset", out poValue2) != 0)
			{
				cover.ModelOffsets.X = poValue2;
			}
			if (hxCfgFile.LookupDataDefValueAsDouble(iDataDefName, iInstanceName, "3DyOffset", out poValue2) != 0)
			{
				cover.ModelOffsets.Y = poValue2;
			}
			if (hxCfgFile.LookupDataDefValueAsDouble(iDataDefName, iInstanceName, "3DzOffset", out poValue2) != 0)
			{
				cover.ModelOffsets.Z = poValue2;
			}
		}
		if (hxCfgFile.LookupDataDefValueAsDouble(iDataDefName, iInstanceName, "Dim.Dx", out poValue2) != 0)
		{
			cover.Dimensions.X = poValue2;
		}
		if (hxCfgFile.LookupDataDefValueAsDouble(iDataDefName, iInstanceName, "Dim.Dy", out poValue2) != 0)
		{
			cover.Dimensions.Y = poValue2;
		}
		if (hxCfgFile.LookupDataDefValueAsDouble(iDataDefName, iInstanceName, "Dim.Dz", out poValue2) != 0)
		{
			cover.Dimensions.Z = poValue2;
		}
		if (hxCfgFile.LookupDataDefValueAsDouble(iDataDefName, iInstanceName, "CoverThickness", out poValue2) != 0)
		{
			cover.Thickness = poValue2;
		}
		if (hxCfgFile.LookupDataDefValueAsDouble(iDataDefName, iInstanceName, "StackHt", out poValue2) != 0)
		{
			cover.StackHeight = poValue2;
		}
		if (hxCfgFile.LookupDataDefValueAsDouble(iDataDefName, iInstanceName, "RackBaseToCoverBase", out poValue2) != 0)
		{
			cover.RackBaseToCoverBase = poValue2;
		}
		if (hxCfgFile.LookupDataDefValueAsDouble(iDataDefName, iInstanceName, "CoveredStackHt", out poValue2) != 0)
		{
			cover.CoveredRackStackHeight = poValue2;
		}
		if (hxCfgFile.LookupDataDefValueAsDouble(iDataDefName, iInstanceName, "XExtent", out poValue2) != 0)
		{
			cover.OverriddenExtent.X = poValue2;
		}
		if (hxCfgFile.LookupDataDefValueAsDouble(iDataDefName, iInstanceName, "YExtent", out poValue2) != 0)
		{
			cover.OverriddenExtent.Y = poValue2;
		}
		hxCfgFile = null;
	}

	private static void HandleDrawContainerError(string error, DrawContainer drawContainer)
	{
		drawContainer.FileStatus = FileOpeningStatus.Error;
		if (error.Contains("An error occurred while running Vector."))
		{
			int num = error.IndexOf(':');
			int num2 = error.IndexOf(')');
			string text = error.Substring(num + 1, num2 - num);
			drawContainer.FileStatusError = text.Replace("\n", string.Empty);
		}
		else
		{
			drawContainer.FileStatusError = error;
		}
	}

	private static CategoryData Deserialize(string serializedCategoryData)
	{
		//IL_001e: Unknown result type (might be due to invalid IL or missing references)
		//IL_0023: Unknown result type (might be due to invalid IL or missing references)
		//IL_0031: Unknown result type (might be due to invalid IL or missing references)
		//IL_0055: Expected O, but got Unknown
		string[] array = serializedCategoryData.Split(new string[2] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries);
		return new CategoryData
		{
			NextAddedCategoryId = Convert.ToInt32(array[0]),
			LabwareCategories = array.Skip(2).Select((Func<string, CategoryEntry>)LabwareCategorySerializer.Deserialize).ToList()
		};
	}

	private static List<LabwareIndexData> ReadLabwareFilter(string filterFullFilePath)
	{
		List<LabwareIndexData> list = new List<LabwareIndexData>();
		string[] array = File.ReadAllText(filterFullFilePath).Split(new string[2] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries);
		for (int i = 0; i < array.Length; i++)
		{
			string[] array2 = Regex.Split(array[i], "(?<!\\\\),");
			int categoryId = Convert.ToInt32(array2[0]);
			string name = array2[1];
			string description = array2[2];
			string fileNameWithExtension = array2[3];
			string filePathVectorRelative = array2[4];
			list.Add(new LabwareIndexData(categoryId, name, description, fileNameWithExtension, filePathVectorRelative));
		}
		return list;
	}
}
