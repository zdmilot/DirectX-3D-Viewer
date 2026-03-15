using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Threading;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Ioc;
using Hamilton.Interop.HxCfgFil;
using HxLabwrEd2.CustomControls.RackDrawing.CircularRackDrawingMath;
using HxLabwrEd2.Extensions;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;
using HxLabwrEd2.ViewModel;

namespace HxLabwrEd2.ConfigFileWritingAndReading;

public static class ConfigFileWriter
{
	public static bool Save(Labware labware, bool clearAuditHistory)
	{
		if (labware != null && !string.IsNullOrEmpty(labware.LabwareFileFullPath))
		{
			bool flag = false;
			string text = "";
			try
			{
				labware.Saving = true;
				if (!File.Exists(labware.LabwareFileFullPath))
				{
					new HxCfgFileClass().SerializeFile(labware.LabwareFileFullPath, 0);
					flag = true;
				}
				else if (HxRegHelper.UseAuditTrail == AuditTrail.AuditTrailForced)
				{
					text = BackUpLabwareFile(labware.LabwareFileFullPath);
				}
				if (HxRegHelper.UseAuditTrail == AuditTrail.AuditTrailDisabled || HxRegHelper.UseAuditTrail == AuditTrail.AuditTrailEnabled)
				{
					if (WriteLabware(labware))
					{
						return true;
					}
				}
				else if (HxAuditTrailHelper.EnterChangeDataForFile(labware.LabwareFileFullPath, clearAuditHistory))
				{
					if (WriteLabware(labware))
					{
						return true;
					}
				}
				else if (flag)
				{
					File.Delete(labware.LabwareFileFullPath);
				}
				else if (!string.IsNullOrEmpty(text))
				{
					RestoreBackedUpFile(text, labware.LabwareFileFullPath);
				}
			}
			catch (Exception ex)
			{
				string trimmedMessage = ex.Message.TrimEnd(Environment.NewLine.ToCharArray());
				Application.Current.Dispatcher.BeginInvoke((Action)delegate
				{
					DialogWindowHelper.ShowDialogWithProportionalDimensions("", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogSimpleWarningViewModel>(), trimmedMessage, 0.45, 0.35);
				}, DispatcherPriority.Background, null);
				if (flag)
				{
					File.Delete(labware.LabwareFileFullPath);
				}
				else if (!string.IsNullOrEmpty(text))
				{
					RestoreBackedUpFile(text, labware.LabwareFileFullPath);
				}
			}
			finally
			{
				labware.Saving = false;
			}
		}
		return false;
	}

	public static bool Validate(Labware labware)
	{
		if (labware != null && !string.IsNullOrEmpty(labware.LabwareFileFullPath))
		{
			try
			{
				if (HxRegHelper.UseAuditTrail == AuditTrail.AuditTrailDisabled)
				{
					if (WriteLabware(labware) && SetLabwareValidation(labware))
					{
						return true;
					}
				}
				else if (HxAuditTrailHelper.EnterValidationDataForFile(labware.LabwareFileFullPath) && WriteLabware(labware) && SetLabwareValidation(labware))
				{
					return true;
				}
			}
			catch (Exception ex)
			{
				string trimmedMessage = ex.Message.TrimEnd(Environment.NewLine.ToCharArray());
				Application.Current.Dispatcher.BeginInvoke((Action)delegate
				{
					DialogWindowHelper.ShowDialogWithProportionalDimensions("", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogSimpleWarningViewModel>(), trimmedMessage, 0.45, 0.35);
				}, DispatcherPriority.Background, null);
			}
		}
		return false;
	}

	public static bool WriteCategoryFile(int nextAvailableCategoryId, string vectorGuid, List<CategoryNode> orderedCategoryList)
	{
		string path = HxRegHelper.LabwarePath + "\\Category.dat";
		try
		{
			if (orderedCategoryList == null || orderedCategoryList.Count == 0)
			{
				throw new Exception("Unable to Save Categories, no Categories present!");
			}
			StringBuilder stringBuilder = new StringBuilder();
			stringBuilder.AppendLine(nextAvailableCategoryId.ToString());
			stringBuilder.AppendLine(vectorGuid);
			foreach (CategoryNode orderedCategory in orderedCategoryList)
			{
				stringBuilder.AppendLine(SerializeCategoryNode(orderedCategory));
			}
			string contents = stringBuilder.ToString();
			File.WriteAllText(path, contents);
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

	public static bool WriteLabwareFilterConfigFile(bool filteringEnabled, string currentFilterName = null)
	{
		try
		{
			HxCfgFileClass hxCfgFileClass = new HxCfgFileClass();
			string iDataDefName = "LABWAREFILTERING";
			short iVersionNum = 1;
			string iInstanceName = "default";
			string text = HxRegHelper.ConfigPath + "\\Labware Filtering\\LabwareFiltering.cfg";
			if (File.Exists(text))
			{
				hxCfgFileClass.LoadFile(text);
				hxCfgFileClass.DeleteDataDef(iDataDefName, iInstanceName);
			}
			hxCfgFileClass.PutShortValueInDataDef(iDataDefName, iVersionNum, iInstanceName, "LabwareFilteringEnabled", filteringEnabled ? ((short)1) : ((short)0));
			if (filteringEnabled)
			{
				hxCfgFileClass.PutStringValueInDataDef(iDataDefName, iVersionNum, iInstanceName, "CurrentFilterName", string.IsNullOrEmpty(currentFilterName) ? "Default" : currentFilterName);
			}
			hxCfgFileClass.SerializeFile(text, 1);
			hxCfgFileClass = null;
		}
		catch (Exception)
		{
			return false;
		}
		return true;
	}

	public static bool WriteLabwareIndexFile(string fullFilePath, List<LabwareIndexData> data)
	{
		try
		{
			StringBuilder stringBuilder = new StringBuilder();
			foreach (LabwareIndexData datum in data)
			{
				stringBuilder.AppendLine(SerializeLabwareIndexData(datum));
			}
			string contents = stringBuilder.ToString();
			File.WriteAllText(fullFilePath, contents);
		}
		catch (Exception ex)
		{
			string trimmedMessage = ex.Message.TrimEnd(Environment.NewLine.ToCharArray());
			Application.Current.Dispatcher.BeginInvoke((Action)delegate
			{
				DialogWindowHelper.ShowDialogWithProportionalDimensions("Error!", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogSimpleWarningViewModel>(), "Unable to save Filter/Index file: " + trimmedMessage, 0.45, 0.25);
			}, DispatcherPriority.Background, null);
			return false;
		}
		return true;
	}

	private static bool WriteLabware(Labware labware)
	{
		HxCfgFileClass hxCfgFileClass = new HxCfgFileClass();
		if (labware is Carrier)
		{
			LoadSitePedestalData(labware as Carrier, "TEMPLATE", "default");
			WriteLabwareBaseInfo(labware, "TEMPLATE", "default", 1, hxCfgFileClass);
			WriteCarrier(labware as Carrier, "TEMPLATE", "default", 1, hxCfgFileClass);
		}
		else if (labware is Template)
		{
			WriteLabwareBaseInfo(labware, "TEMPLATE", "default", 1, hxCfgFileClass);
			WriteTemplate(labware as Template, "TEMPLATE", "default", 1, hxCfgFileClass);
		}
		else if (labware is RectangularRack)
		{
			WriteLabwareBaseInfo(labware, "RECTRACK", "default", 3, hxCfgFileClass);
			WriteRectangularRack(labware as RectangularRack, "RECTRACK", "default", 3, hxCfgFileClass);
		}
		else if (labware is CircularRack)
		{
			WriteLabwareBaseInfo(labware, "CIRCRACK", "default", 4, hxCfgFileClass);
			WriteCircularRack(labware as CircularRack, "CIRCRACK", "default", 4, hxCfgFileClass);
		}
		else if (labware is Container)
		{
			WriteLabwareBaseInfo(labware, "CONTAINER", "default", 3, hxCfgFileClass);
			WriteContainer(labware as Container, "CONTAINER", "default", 3, hxCfgFileClass);
		}
		if (labware.CategoriesChanged && !(labware is Container) && !ConfigFileReader.ReadLabwareFilterConfig(out var _))
		{
			new Task(delegate
			{
				FilterIndexFileHelper.GenerateLabwareIndexFile();
			}).Start();
		}
		return true;
	}

	private static void WriteLabwareBaseInfo(Labware labware, string dataDef, string dataInstance, short dataVersion, HxCfgFileClass hxCfgFile)
	{
		hxCfgFile.LoadFile(labware.LabwareFileFullPath);
		hxCfgFile.DeleteDataDef(dataDef, dataInstance);
		if (!string.IsNullOrWhiteSpace(labware.Bitmap))
		{
			string qualifiedPath = ConfigSharedHelpers.GetQualifiedPath(labware.Bitmap, labware.LabwareFileFullPath, HxRegHelper.LabwarePath);
			string relativeToDefault = ConfigSharedHelpers.GetRelativeToDefault(qualifiedPath, HxRegHelper.LabwarePath);
			if (!string.IsNullOrEmpty(relativeToDefault))
			{
				hxCfgFile.PutStringValueInDataDef(dataDef, dataVersion, dataInstance, "Bitmap", relativeToDefault);
			}
			string relativeToParent = ConfigSharedHelpers.GetRelativeToParent(qualifiedPath, labware.LabwareFileFullPath, HxRegHelper.LabwarePath);
			if (!string.IsNullOrEmpty(relativeToParent))
			{
				hxCfgFile.PutStringValueInDataDef(dataDef, dataVersion, dataInstance, "BitmapRel", relativeToParent);
			}
		}
		if (!string.IsNullOrWhiteSpace(labware.Image))
		{
			string qualifiedPath2 = ConfigSharedHelpers.GetQualifiedPath(labware.Image, labware.LabwareFileFullPath, HxRegHelper.LabwarePath);
			string relativeToDefault = ConfigSharedHelpers.GetRelativeToDefault(qualifiedPath2, HxRegHelper.LabwarePath);
			if (!string.IsNullOrEmpty(relativeToDefault))
			{
				hxCfgFile.PutStringValueInDataDef(dataDef, dataVersion, dataInstance, "Image3D", relativeToDefault);
			}
			string relativeToParent = ConfigSharedHelpers.GetRelativeToParent(qualifiedPath2, labware.LabwareFileFullPath, HxRegHelper.LabwarePath);
			if (!string.IsNullOrEmpty(relativeToParent))
			{
				hxCfgFile.PutStringValueInDataDef(dataDef, dataVersion, dataInstance, "ImageRel", relativeToParent);
			}
		}
		if (!string.IsNullOrWhiteSpace(labware.Model))
		{
			string qualifiedPath3 = ConfigSharedHelpers.GetQualifiedPath(labware.Model, labware.LabwareFileFullPath, HxRegHelper.LabwarePath);
			string relativeToDefault = ConfigSharedHelpers.GetRelativeToDefault(qualifiedPath3, HxRegHelper.LabwarePath);
			if (!string.IsNullOrEmpty(relativeToDefault))
			{
				hxCfgFile.PutStringValueInDataDef(dataDef, dataVersion, dataInstance, "3DModel", relativeToDefault);
			}
			string relativeToParent = ConfigSharedHelpers.GetRelativeToParent(qualifiedPath3, labware.LabwareFileFullPath, HxRegHelper.LabwarePath);
			if (!string.IsNullOrEmpty(relativeToParent))
			{
				hxCfgFile.PutStringValueInDataDef(dataDef, dataVersion, dataInstance, "3DModelRel", relativeToParent);
			}
			hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "3DxOffset", labware.ModelOffsets.X);
			hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "3DyOffset", labware.ModelOffsets.Y);
			hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "3DzOffset", labware.ModelOffsets.Z);
		}
		if (!(labware is Container))
		{
			hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "Dim.Dx", labware.Dimensions.X);
			hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "Dim.Dy", labware.Dimensions.Y);
			hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "Dim.Dz", labware.Dimensions.Z);
		}
		hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "Clearance", labware.Clearance);
		short iValue = (labware.UseBoundary ? ((short)1) : ((short)0));
		hxCfgFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, "UseBndry", iValue);
		if (labware.UseBoundary)
		{
			iValue = (short)labware.BoundaryShape;
			hxCfgFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, "Shape", iValue);
			hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "BndryX", labware.BoundaryOffsets.X);
			hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "BndryY", labware.BoundaryOffsets.Y);
		}
		iValue = (short)labware.CategoryIds.Count;
		hxCfgFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, "CategoryCnt", iValue);
		if (labware.CategoryIds.Count > 0)
		{
			IEnumerator<int> enumerator = labware.CategoryIds.OrderBy((int category) => category).GetEnumerator();
			int num = 0;
			while (enumerator.MoveNext())
			{
				string iVariableName = $"Category.{num++}.Id";
				hxCfgFile.PutLongValueInDataDef(dataDef, dataVersion, dataInstance, iVariableName, enumerator.Current);
			}
		}
		hxCfgFile.PutStringValueInDataDef(dataDef, dataVersion, dataInstance, "ViewName", labware.Name);
		hxCfgFile.PutStringValueInDataDef(dataDef, dataVersion, dataInstance, "Description", labware.Description);
		iValue = (labware.Visible ? ((short)1) : ((short)0));
		hxCfgFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, "Visible", iValue);
		hxCfgFile.PutStringValueInDataDef(dataDef, dataVersion, dataInstance, "Barcode.Value", labware.Barcode);
		iValue = (labware.BarcodeIsUnique ? ((short)1) : ((short)0));
		hxCfgFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, "Barcode.Unique", iValue);
		if (labware.Properties != null && labware.Properties.Count > 0)
		{
			IEnumerator<Property> enumerator2 = labware.Properties.OrderBy((Property property) => property.Name).GetEnumerator();
			hxCfgFile.PutLongValueInDataDef(dataDef, dataVersion, dataInstance, "PropertyCnt", labware.Properties.Count);
			int num2 = 1;
			while (enumerator2.MoveNext())
			{
				string iVariableName = $"Property.{num2}";
				hxCfgFile.PutStringValueInDataDef(dataDef, dataVersion, dataInstance, iVariableName, enumerator2.Current.Name);
				iVariableName = $"PropertyValue.{num2}";
				hxCfgFile.PutStringValueInDataDef(dataDef, dataVersion, dataInstance, iVariableName, enumerator2.Current.Value);
				num2++;
			}
		}
	}

	private static void WriteCarrier(Carrier carrier, string dataDef, string dataInstance, short dataVersion, HxCfgFileClass hxCfgFile)
	{
		GenerateTemplateSites(carrier);
		TemplateHelper.UpdateAssignedLabwarePaths(carrier, null);
		WriteTemplate(carrier, dataDef, dataInstance, dataVersion, hxCfgFile);
	}

	private static void WriteTemplate(Template template, string dataDef, string dataInstance, short dataVersion, HxCfgFileClass hxCfgFile)
	{
		hxCfgFile.PutLongValueInDataDef(dataDef, dataVersion, dataInstance, "BackgrndClr", ColorHelper.ColorToVectorLabwareColorInt(template.BackgroundColor));
		if (template.Sites != null && template.Sites.Count > 0)
		{
			int num = 1;
			foreach (Site site in template.Sites)
			{
				PutSiteValueInDataDef(template, site, num++, template.LabwareFileFullPath, hxCfgFile, dataDef, dataInstance, dataVersion);
			}
			hxCfgFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, "Site.Cnt", (short)template.Sites.Count);
		}
		hxCfgFile.SerializeFile(template.LabwareFileFullPath, 1);
	}

	private static void WriteRectangularRack(RectangularRack rectangularRack, string dataDef, string dataInstance, short dataVersion, HxCfgFileClass hxCfgFile)
	{
		WriteRack(rectangularRack, dataDef, dataInstance, dataVersion, hxCfgFile);
		if (rectangularRack.UseGripSegments)
		{
			hxCfgFile.PutLongValueInDataDef(dataDef, dataVersion, dataInstance, "SegmentCount_x", rectangularRack.GripSegmentsX.Count);
			hxCfgFile.PutLongValueInDataDef(dataDef, dataVersion, dataInstance, "SegmentCount_y", rectangularRack.GripSegmentsY.Count);
			if (rectangularRack.GripSegmentsX != null && rectangularRack.GripSegmentsX.Count > 0)
			{
				for (int i = 0; i < rectangularRack.GripSegmentsX.Count; i++)
				{
					hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, $"Seg_x.{i}.SegmentHeight", rectangularRack.GripSegmentsX[i].Height);
					hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, $"Seg_x.{i}.LowerWidth", rectangularRack.GripSegmentsX[i].LowerWidth);
					hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, $"Seg_x.{i}.UpperWidth", rectangularRack.GripSegmentsX[i].UpperWidth);
				}
			}
			if (rectangularRack.GripSegmentsY != null && rectangularRack.GripSegmentsY.Count > 0)
			{
				for (int j = 0; j < rectangularRack.GripSegmentsY.Count; j++)
				{
					hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, $"Seg_y.{j}.SegmentHeight", rectangularRack.GripSegmentsY[j].Height);
					hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, $"Seg_y.{j}.LowerWidth", rectangularRack.GripSegmentsY[j].LowerWidth);
					hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, $"Seg_y.{j}.UpperWidth", rectangularRack.GripSegmentsY[j].UpperWidth);
				}
			}
		}
		else
		{
			hxCfgFile.PutLongValueInDataDef(dataDef, dataVersion, dataInstance, "SegmentCount_x", 0);
			hxCfgFile.PutLongValueInDataDef(dataDef, dataVersion, dataInstance, "SegmentCount_y", 0);
		}
		hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "Dx", rectangularRack.ColumnSpacing);
		hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "Dy", rectangularRack.RowSpacing);
		if (!rectangularRack.Stagger.Enabled)
		{
			hxCfgFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, "Options", 0);
		}
		else if (rectangularRack.Stagger.OffsetDirection == OffsetDirection.In)
		{
			hxCfgFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, "Options", 1);
		}
		else
		{
			hxCfgFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, "Options", 2);
		}
		hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "Stagger", rectangularRack.Stagger.OffsetValue);
		short iValue = ((rectangularRack.RectangularDefaultSequence.StartCorner != Corner.BackLeft) ? ((short)1) : ((short)0));
		hxCfgFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, "IX.Start", iValue);
		iValue = ((rectangularRack.RectangularDefaultSequence.IncrementDirection != IncrementDirection.RowFirst) ? ((short)1) : ((short)0));
		hxCfgFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, "IX.Inc", iValue);
		iValue = (rectangularRack.RectangularDefaultSequence.UseDefaultStartValue ? ((short)1) : ((short)0));
		hxCfgFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, "IX.Index", iValue);
		hxCfgFile.PutLongValueInDataDef(dataDef, dataVersion, dataInstance, "IX.First", rectangularRack.RectangularDefaultSequence.UserStartValue);
		if (rectangularRack.WellPattern != WellPattern.None)
		{
			if (rectangularRack.WellPattern == WellPattern.Irregular)
			{
				iValue = 3;
				hxCfgFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, "DataType", iValue);
				iValue = (short)rectangularRack.RackWells.Count;
				hxCfgFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, "HoleCnt", iValue);
				int num = 0;
				int num2 = 1;
				while (num < rectangularRack.RackWells.Count)
				{
					hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, $"{num2}.X", rectangularRack.RackWells[num].CenterX);
					hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, $"{num2}.Y", rectangularRack.RackWells[num].CenterY);
					hxCfgFile.PutStringValueInDataDef(dataDef, dataVersion, dataInstance, $"{num2}.ID", rectangularRack.RackWells[num].Label);
					num++;
					num2++;
				}
			}
			else
			{
				hxCfgFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, "Rows", (short)rectangularRack.Rows);
				hxCfgFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, "Columns", (short)rectangularRack.Columns);
				hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "Dx", rectangularRack.ColumnSpacing);
				hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "Dy", rectangularRack.RowSpacing);
				if (rectangularRack.ContainerLayout != ContainerLayout.MultipleContainers && (rectangularRack.WellPattern == WellPattern.Standard96Plate || rectangularRack.WellPattern == WellPattern.Standard384Plate || rectangularRack.WellPattern == WellPattern.Standard1536Plate))
				{
					if (rectangularRack.Orientation == Orientation.Portrait)
					{
						iValue = 0;
						hxCfgFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, "DataType", iValue);
					}
					else
					{
						iValue = 1;
						hxCfgFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, "DataType", iValue);
					}
				}
				else
				{
					iValue = 2;
					hxCfgFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, "DataType", iValue);
				}
			}
		}
		if (rectangularRack.WellPattern == WellPattern.Irregular)
		{
			hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "BndryX", rectangularRack.IrregularRackBoundaryOffsets.X);
			hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "BndryY", rectangularRack.IrregularRackBoundaryOffsets.Y);
		}
		hxCfgFile.SerializeFile(rectangularRack.LabwareFileFullPath, 1);
	}

	private static void WriteRack(Rack rack, string dataDef, string dataInstance, short dataVersion, HxCfgFileClass configFile)
	{
		Action<string, short> action = delegate(string key, short value)
		{
			configFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, key, value);
		};
		Action<string, int> action2 = delegate(string key, int value)
		{
			configFile.PutLongValueInDataDef(dataDef, dataVersion, dataInstance, key, value);
		};
		Action<string, double> writeDouble = delegate(string key, double value)
		{
			configFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, key, value);
		};
		Action<string, string> writeString = delegate(string key, string value)
		{
			configFile.PutStringValueInDataDef(dataDef, dataVersion, dataInstance, key, value);
		};
		writeDouble("StackHt", rack.StackHeight);
		if (rack is RectangularRack && ((rack as RectangularRack).WellPattern == WellPattern.Standard1536Plate || (rack as RectangularRack).WellPattern == WellPattern.Standard384Plate || (rack as RectangularRack).WellPattern == WellPattern.Standard96Plate))
		{
			action2("ConnectedCtr", 0);
		}
		else
		{
			action2("ConnectedCtr", Convert.ToInt32(rack.ContainersAreConnected));
		}
		DrawContainer drawContainer = null;
		if ((rack.ContainerLayout == ContainerLayout.SingleContainer && string.IsNullOrWhiteSpace(rack.SingleRepeatingContainer.FilePath)) || (rack.ContainerLayout == ContainerLayout.MultipleContainers && rack.RackWells.FirstOrDefault((RackWell well) => !string.IsNullOrWhiteSpace(well.ContainerFilePath)) == null))
		{
			rack.ContainerLayout = ContainerLayout.WellsOnly;
		}
		string qualifiedFilePath;
		string standardRelativeFilePath;
		string parentRelativeFilePath;
		switch (rack.ContainerLayout)
		{
		case ContainerLayout.WellsOnly:
			action("CntrCnt", 0);
			action("SingleCntr", 0);
			break;
		case ContainerLayout.SingleContainer:
			action("SingleCntr", 1);
			writeDouble($"Cntr.{1}.offsetx", rack.SingleRepeatingContainer.Offsets.X);
			writeDouble($"Cntr.{1}.offsety", rack.SingleRepeatingContainer.Offsets.Y);
			writeDouble($"Cntr.{1}.base", rack.SingleRepeatingContainer.Offsets.Z);
			if (rack.DrawContainers[rack.SingleRepeatingContainer.RelativeFilePath].Status == AssignedLabwareStatus.FoundUsingAbsolutePath)
			{
				qualifiedFilePath = ConfigSharedHelpers.GetQualifiedPath(rack.SingleRepeatingContainer.FilePath, rack.LabwareFileFullPath, HxRegHelper.LabwarePath);
				standardRelativeFilePath = ConfigSharedHelpers.GetRelativeToDefault(qualifiedFilePath, HxRegHelper.LabwarePath);
				if (!string.IsNullOrEmpty(standardRelativeFilePath))
				{
					writeString($"Cntr.{1}.file", standardRelativeFilePath);
				}
				parentRelativeFilePath = ConfigSharedHelpers.GetRelativeToParent(qualifiedFilePath, rack.LabwareFileFullPath, HxRegHelper.LabwarePath);
				if (!string.IsNullOrEmpty(parentRelativeFilePath))
				{
					writeString($"Cntr.{1}.fileRel", parentRelativeFilePath);
				}
			}
			else if (rack.DrawContainers[rack.SingleRepeatingContainer.RelativeFilePath].Status == AssignedLabwareStatus.FoundUsingRelativePath)
			{
				writeString($"Cntr.{1}.fileRel", rack.SingleRepeatingContainer.RelativeFilePath);
				qualifiedFilePath = ConfigSharedHelpers.GetQualifiedPath(rack.SingleRepeatingContainer.RelativeFilePath, rack.LabwareFileFullPath, rack.SingleRepeatingContainer.FilePath);
				standardRelativeFilePath = ConfigSharedHelpers.GetRelativeToDefault(qualifiedFilePath, HxRegHelper.LabwarePath);
				if (!string.IsNullOrEmpty(standardRelativeFilePath))
				{
					writeString($"Cntr.{1}.file", standardRelativeFilePath);
				}
			}
			else
			{
				writeString($"Cntr.{1}.file", rack.SingleRepeatingContainer.FilePath);
				writeString($"Cntr.{1}.fileRel", rack.SingleRepeatingContainer.RelativeFilePath);
			}
			drawContainer = rack.DrawContainers[rack.SingleRepeatingContainer.RelativeFilePath];
			break;
		case ContainerLayout.MultipleContainers:
		{
			action("SingleCntr", 0);
			drawContainer = rack.DrawContainers[rack.RackWells.First((RackWell rackWell) => !string.IsNullOrEmpty(rackWell.ContainerRelativeFilePath)).ContainerRelativeFilePath];
			Dictionary<string, Tuple<string, string>> recalculatedPaths = new Dictionary<string, Tuple<string, string>>();
			int rackWellIndex = 1;
			rack.RackWells.Each(delegate(RackWell rackWell, int index)
			{
				if (!string.IsNullOrWhiteSpace(rackWell.ContainerFilePath))
				{
					writeString($"Cntr.{rackWellIndex}.posn", rackWell.Label);
					writeDouble($"Cntr.{rackWellIndex}.offsetx", rackWell.ContainerOffsets.X);
					writeDouble($"Cntr.{rackWellIndex}.offsety", rackWell.ContainerOffsets.Y);
					writeDouble($"Cntr.{rackWellIndex}.base", rackWell.ContainerOffsets.Z);
					if (recalculatedPaths.ContainsKey(rackWell.ContainerRelativeFilePath))
					{
						writeString($"Cntr.{rackWellIndex}.file", recalculatedPaths[rackWell.ContainerRelativeFilePath].Item1);
						writeString($"Cntr.{rackWellIndex}.fileRel", recalculatedPaths[rackWell.ContainerRelativeFilePath].Item2);
					}
					else if (rack.DrawContainers[rackWell.ContainerRelativeFilePath].Status == AssignedLabwareStatus.FoundUsingAbsolutePath)
					{
						qualifiedFilePath = ConfigSharedHelpers.GetQualifiedPath(rackWell.ContainerFilePath, rack.LabwareFileFullPath, HxRegHelper.LabwarePath);
						standardRelativeFilePath = ConfigSharedHelpers.GetRelativeToDefault(qualifiedFilePath, HxRegHelper.LabwarePath);
						if (!string.IsNullOrEmpty(standardRelativeFilePath))
						{
							writeString($"Cntr.{rackWellIndex}.file", standardRelativeFilePath);
						}
						parentRelativeFilePath = ConfigSharedHelpers.GetRelativeToParent(qualifiedFilePath, rack.LabwareFileFullPath, HxRegHelper.LabwarePath);
						if (!string.IsNullOrEmpty(parentRelativeFilePath))
						{
							writeString($"Cntr.{rackWellIndex}.fileRel", parentRelativeFilePath);
						}
						recalculatedPaths.Add(rackWell.ContainerRelativeFilePath, new Tuple<string, string>(standardRelativeFilePath, parentRelativeFilePath));
					}
					else if (rack.DrawContainers[rackWell.ContainerRelativeFilePath].Status == AssignedLabwareStatus.FoundUsingRelativePath)
					{
						writeString($"Cntr.{rackWellIndex}.fileRel", rackWell.ContainerRelativeFilePath);
						qualifiedFilePath = ConfigSharedHelpers.GetQualifiedPath(rackWell.ContainerRelativeFilePath, rack.LabwareFileFullPath, rackWell.ContainerFilePath);
						standardRelativeFilePath = ConfigSharedHelpers.GetRelativeToDefault(qualifiedFilePath, HxRegHelper.LabwarePath);
						if (!string.IsNullOrEmpty(standardRelativeFilePath))
						{
							writeString($"Cntr.{rackWellIndex}.file", standardRelativeFilePath);
						}
						recalculatedPaths.Add(rackWell.ContainerRelativeFilePath, new Tuple<string, string>(standardRelativeFilePath, rackWell.ContainerRelativeFilePath));
					}
					else
					{
						writeString($"Cntr.{rackWellIndex}.file", rackWell.ContainerFilePath);
						writeString($"Cntr.{rackWellIndex}.fileRel", rackWell.ContainerRelativeFilePath);
						recalculatedPaths.Add(rackWell.ContainerRelativeFilePath, new Tuple<string, string>(rackWell.ContainerFilePath, rackWell.ContainerRelativeFilePath));
					}
					rackWellIndex++;
				}
			});
			action("CntrCnt", (short)rack.RackWells.Count((RackWell rackWell) => rackWell.HasContainer()));
			break;
		}
		default:
			throw new ArgumentOutOfRangeException();
		}
		if (drawContainer != null && drawContainer.Status != AssignedLabwareStatus.NotFound)
		{
			action("Hole.Shape", (short)drawContainer.Shape);
			writeDouble("Hole.Z", drawContainer.Dimensions.Z);
			writeDouble("Hole.Y", drawContainer.Dimensions.Y);
			writeDouble("Hole.X", drawContainer.Dimensions.X);
		}
		else
		{
			action("Hole.Shape", 0);
			writeDouble("Hole.Z", rack.WellDiameter);
			writeDouble("Hole.Y", 0.0);
			writeDouble("Hole.X", 0.0);
		}
		configFile.SerializeFile(rack.LabwareFileFullPath, 1);
		string text = Path.Combine(Path.GetDirectoryName(rack.LabwareFileFullPath) + "\\" + Path.GetFileNameWithoutExtension(rack.LabwareFileFullPath) + ".lid");
		if (File.Exists(text))
		{
			File.Delete(text);
		}
		if (rack.UseCover)
		{
			WriteCover(rack, text);
		}
		action2("BackgrndClr", ColorHelper.ColorToVectorLabwareColorInt(rack.BackgroundColor));
	}

	private static void WriteCircularRack(CircularRack circularRack, string dataDef, string dataInstance, short dataVersion, HxCfgFileClass configFile)
	{
		Action<string, int> writeInt = delegate(string key, int value)
		{
			configFile.PutLongValueInDataDef(dataDef, dataVersion, dataInstance, key, value);
		};
		Action<string, double> writeDouble = delegate(string key, double value)
		{
			configFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, key, value);
		};
		WriteRack(circularRack, dataDef, dataInstance, dataVersion, configFile);
		writeInt("Options", 0);
		writeDouble("CenterX", circularRack.Center.X);
		writeDouble("CenterY", circularRack.Center.Y);
		writeInt("Segments", circularRack.Segments.Count);
		circularRack.Segments.Each(delegate(CircularRackSegment segment, int index)
		{
			List<Vector2> evenlySpacedAlongEdgeAbsolutePoints = segment.Arc.GetEvenlySpacedAlongEdgeAbsolutePoints(segment.HoleCount, ArcAngleDirection.Clockwise);
			Vector2 vector = (segment.Arc.ClockwiseAngle.IsFullCircle() ? evenlySpacedAlongEdgeAbsolutePoints.Last() : segment.Arc.AbsoluteEndPoint);
			int index2 = (int)Math.Ceiling((double)segment.HoleCount / 2.0) - 1;
			Vector2 vector2 = evenlySpacedAlongEdgeAbsolutePoints.ElementAt(index2);
			int num = index + 1;
			writeInt($"{num}.HoleCnt", segment.HoleCount);
			writeDouble($"{num}.FirstX", segment.Arc.AbsoluteStartPoint.X);
			writeDouble($"{num}.FirstY", segment.Arc.AbsoluteStartPoint.Y);
			writeDouble($"{num}.MidX", vector2.X);
			writeDouble($"{num}.MidY", vector2.Y);
			writeDouble($"{num}.LastX", vector.X);
			writeDouble($"{num}.LastY", vector.Y);
		});
		writeInt("IX.Inc", (int)circularRack.CircularDefaultSequence.IncrementDirection);
		writeInt("IX.Start", (int)circularRack.CircularDefaultSequence.StartingSegment);
		writeInt("IX.Index", (int)circularRack.CircularDefaultSequence.SequenceLabelingFormat);
		writeInt("IX.First", circularRack.CircularDefaultSequence.StartingIndex);
		configFile.SerializeFile(circularRack.LabwareFileFullPath, 1);
	}

	private static void WriteContainer(Container container, string dataDef, string dataInstance, short dataVersion, HxCfgFileClass hxCfgFile)
	{
		foreach (ContainerSegment segment in container.Segments)
		{
			segment.RecalculateHeightAndVolume();
		}
		hxCfgFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, "Shape", (short)container.ApertureShape);
		if (container.Segments[0].Shape == Shape.Cylinder || container.Segments[0].Shape == Shape.RoundBase || container.Segments[0].Shape == Shape.VConeBase)
		{
			hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "Dim.Dx", container.Segments[0].Dz);
			hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "Dim.Dy", container.Segments[0].Dz);
		}
		else if (container.Segments[0].Shape == Shape.InvertedVCone || container.Segments[0].Shape == Shape.VCone)
		{
			double iValue = ((!(container.Segments[0].Dx > container.Segments[0].Dy)) ? container.Segments[0].Dy : container.Segments[0].Dx);
			hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "Dim.Dx", iValue);
			hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "Dim.Dy", iValue);
		}
		else
		{
			hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "Dim.Dx", container.Segments[0].Dx);
			hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "Dim.Dy", container.Segments[0].Dy);
		}
		hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "MaxDepth", container.DeadVolumeHeight);
		double num = 0.0;
		foreach (ContainerSegment segment2 in container.Segments)
		{
			num += segment2.Height;
		}
		hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "Depth", num);
		hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "BaseMM", container.BaseThickness);
		hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "TchBase", container.BottomTouchOffHeight);
		hxCfgFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, "LS", container.LLDData.Enabled ? ((short)1) : ((short)0));
		if (container.LLDData.Enabled)
		{
			hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "LSHt", container.LLDData.SeekHeight);
			hxCfgFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, "cLLD", (short)container.LLDData.Sensitivity);
		}
		hxCfgFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, "TchOff", container.WickTouchOffData.Enabled ? ((short)1) : ((short)0));
		if (container.WickTouchOffData.Enabled)
		{
			hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "TchHt", container.WickTouchOffData.Height);
			hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "TchFront", container.WickTouchOffData.Right);
			hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "TchBack", container.WickTouchOffData.Right);
			hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "TchLeft", container.WickTouchOffData.Right);
			hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, "TchRight", container.WickTouchOffData.Right);
		}
		hxCfgFile.PutLongValueInDataDef(dataDef, dataVersion, dataInstance, "Segments", container.Segments.Count);
		int num2 = 1;
		foreach (ContainerSegment segment3 in container.Segments)
		{
			hxCfgFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, $"{num2}.Shape", (short)segment3.Shape);
			hxCfgFile.PutStringValueInDataDef(dataDef, dataVersion, dataInstance, $"{num2}.EqnOfVol", segment3.VolumeEquation);
			hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, $"{num2}.Min", segment3.MinHeight);
			hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, $"{num2}.Max", segment3.MaxHeight);
			hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, $"{num2}.DX", segment3.Dx);
			hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, $"{num2}.DY", segment3.Dy);
			hxCfgFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, $"{num2}.DZ", segment3.Dz);
			num2++;
		}
		hxCfgFile.SerializeFile(container.LabwareFileFullPath, 1);
	}

	private static void LoadSitePedestalData(Carrier carrier, string dataDef, string dataInstance)
	{
		HxCfgFileClass hxCfgFileClass = new HxCfgFileClass();
		bool flag = false;
		Property property = carrier.Properties.FirstOrDefault((Property x) => x.Name == "IsLoadable");
		if (property != null && property.Value == "1")
		{
			flag = true;
		}
		int num = 0;
		for (int num2 = 0; num2 < carrier.Pedestals.Length; num2++)
		{
			if (carrier.Pedestals[num2] == null)
			{
				continue;
			}
			string iFileSpec = Path.Combine(HxRegHelper.LabwarePath, carrier.Pedestals[num2].TemplateFilePath);
			hxCfgFileClass.LoadFile(iFileSpec);
			string poValue;
			if (flag)
			{
				hxCfgFileClass.LookupDataDefValueAsString(dataDef, dataInstance, "Barcode.Value", out poValue);
				if (!string.IsNullOrEmpty(poValue))
				{
					carrier.Properties.Add(new Property($"BCMaskP{num2 + 1}", poValue));
					num++;
				}
			}
			hxCfgFileClass.LookupDataDefValueAsDouble(dataDef, dataInstance, "Dim.Dx", out var poValue2);
			carrier.Pedestals[num2].Dimensions.X = poValue2;
			hxCfgFileClass.LookupDataDefValueAsDouble(dataDef, dataInstance, "Dim.Dy", out poValue2);
			carrier.Pedestals[num2].Dimensions.Y = poValue2;
			hxCfgFileClass.LookupDataDefValueAsShort(dataDef, dataInstance, "Site.Cnt", out var poValue3);
			carrier.Pedestals[num2].Sites = new Site[poValue3];
			for (int num3 = 0; num3 < carrier.Pedestals[num2].Sites.Length; num3++)
			{
				carrier.Pedestals[num2].Sites[num3] = new Site();
				int num4 = num3 + 1;
				hxCfgFileClass.LookupDataDefValueAsDouble(dataDef, dataInstance, $"Site.{num4}.Dx", out poValue2);
				carrier.Pedestals[num2].Sites[num3].Dimensions.X = poValue2;
				hxCfgFileClass.LookupDataDefValueAsDouble(dataDef, dataInstance, $"Site.{num4}.Dy", out poValue2);
				carrier.Pedestals[num2].Sites[num3].Dimensions.Y = poValue2;
				hxCfgFileClass.LookupDataDefValueAsDouble(dataDef, dataInstance, $"Site.{num4}.X", out poValue2);
				carrier.Pedestals[num2].Sites[num3].OffsetsToParentOrigin.X = poValue2;
				hxCfgFileClass.LookupDataDefValueAsDouble(dataDef, dataInstance, $"Site.{num4}.Y", out poValue2);
				carrier.Pedestals[num2].Sites[num3].OffsetsToParentOrigin.Y = poValue2;
				hxCfgFileClass.LookupDataDefValueAsDouble(dataDef, dataInstance, $"Site.{num4}.Z", out poValue2);
				carrier.Pedestals[num2].Sites[num3].OffsetsToParentOrigin.Z = poValue2;
				hxCfgFileClass.LookupDataDefValueAsShort(dataDef, dataInstance, $"Site.{num4}.SnapBase", out poValue3);
				carrier.Pedestals[num2].Sites[num3].SnapBase = poValue3 != 0;
				hxCfgFileClass.LookupDataDefValueAsShort(dataDef, dataInstance, $"Site.{num4}.Stack", out poValue3);
				carrier.Pedestals[num2].Sites[num3].IsStack = poValue3 != 0;
				hxCfgFileClass.LookupDataDefValueAsShort(dataDef, dataInstance, $"Site.{num4}.StackSize", out poValue3);
				carrier.Pedestals[num2].Sites[num3].StackSize = poValue3;
				hxCfgFileClass.LookupDataDefValueAsShort(dataDef, dataInstance, $"Site.{num4}.Visible", out poValue3);
				carrier.Pedestals[num2].Sites[num3].Visible = poValue3 != 0;
				hxCfgFileClass.LookupDataDefValueAsShort(dataDef, dataInstance, $"Site.{num4}.IsCovered", out poValue3);
				carrier.Pedestals[num2].Sites[num3].IsCovered = poValue3 != 0;
				hxCfgFileClass.LookupDataDefValueAsShort(dataDef, dataInstance, $"Site.{num4}.Label", out poValue3);
				carrier.Pedestals[num2].Sites[num3].Label = poValue3 != 0;
				hxCfgFileClass.LookupDataDefValueAsShort(dataDef, dataInstance, $"Site.{num4}.Posn", out poValue3);
				carrier.Pedestals[num2].Sites[num3].Position = poValue3;
				hxCfgFileClass.LookupDataDefValueAsString(dataDef, dataInstance, $"Site.{num4}.Id", out poValue);
				carrier.Pedestals[num2].Sites[num3].Id = poValue;
				hxCfgFileClass.LookupDataDefValueAsString(dataDef, dataInstance, $"Site.{num4}.LabwareFile", out poValue);
				carrier.Pedestals[num2].Sites[num3].Labware = poValue;
				hxCfgFileClass.LookupDataDefValueAsString(dataDef, dataInstance, $"Site.{num4}.LabwareFileRel", out poValue);
				carrier.Pedestals[num2].Sites[num3].LabwareRelative = poValue;
			}
		}
		if (num > 0)
		{
			carrier.Properties.Add(new Property("BCPositionCount", num.ToString()));
		}
		if (carrier is StarCarrier)
		{
			Property property2 = carrier.Properties.Where((Property x) => x.Name == "MlStarCarCountOfBCPos").FirstOrDefault();
			if (property2 != null)
			{
				int num5 = 0;
				Pedestal[] pedestals = carrier.Pedestals;
				for (int num6 = 0; num6 < pedestals.Length; num6++)
				{
					if (pedestals[num6] != null)
					{
						num5++;
					}
				}
				property2.Value = num5.ToString();
			}
		}
		hxCfgFileClass = null;
	}

	private static void GenerateTemplateSites(Carrier carrier)
	{
		for (int i = 0; i < carrier.Pedestals.Length; i++)
		{
			if (carrier.Pedestals[i] != null && carrier.Pedestals[i].Sites != null)
			{
				for (int j = 0; j < carrier.Pedestals[i].Sites.Length; j++)
				{
					carrier.Pedestals[i].Sites[j].OffsetsToParentOrigin.X = carrier.PedestalOffsets[i].X - carrier.Pedestals[i].Dimensions.X / 2.0 + carrier.Pedestals[i].Sites[j].OffsetsToParentOrigin.X + carrier.Pedestals[i].SitesOffsetsOverride.X;
					carrier.Pedestals[i].Sites[j].OffsetsToParentOrigin.X = Math.Round(carrier.Pedestals[i].Sites[j].OffsetsToParentOrigin.X, 3, MidpointRounding.AwayFromZero);
					carrier.Pedestals[i].Sites[j].OffsetsToParentOrigin.Y = carrier.PedestalOffsets[i].Y - carrier.Pedestals[i].Dimensions.Y / 2.0 + carrier.Pedestals[i].Sites[j].OffsetsToParentOrigin.Y + carrier.Pedestals[i].SitesOffsetsOverride.Y;
					carrier.Pedestals[i].Sites[j].OffsetsToParentOrigin.Y = Math.Round(carrier.Pedestals[i].Sites[j].OffsetsToParentOrigin.Y, 3, MidpointRounding.AwayFromZero);
					carrier.Pedestals[i].Sites[j].OffsetsToParentOrigin.Z = carrier.Dimensions.Z + carrier.Pedestals[i].Sites[j].OffsetsToParentOrigin.Z;
					carrier.Pedestals[i].Sites[j].OffsetsToParentOrigin.Z = Math.Round(carrier.Pedestals[i].Sites[j].OffsetsToParentOrigin.Z, 3, MidpointRounding.AwayFromZero);
				}
			}
		}
		int num = 1;
		for (int k = 0; k < carrier.Pedestals.Length; k++)
		{
			if (carrier.Pedestals[k] != null && carrier.Pedestals[k].Sites != null && carrier.Pedestals[k].Sites.Length != 0)
			{
				IEnumerator<Site> enumerator = carrier.Pedestals[k].Sites.OrderBy((Site site) => site.Position).GetEnumerator();
				while (enumerator.MoveNext())
				{
					Site item = new Site(enumerator.Current)
					{
						Id = num.ToString(),
						Position = num
					};
					carrier.Sites.Add(item);
					num++;
				}
			}
		}
	}

	private static void PutSiteValueInDataDef(Template template, Site site, int siteNumber, string parentFilePath, HxCfgFile hxConfigFile, string dataDef, string dataInstance, short dataVersion)
	{
		if (!string.IsNullOrWhiteSpace(site.Labware))
		{
			if (template.AssignedRackStatus[site.LabwareRelative] == AssignedLabwareStatus.FoundUsingAbsolutePath)
			{
				string qualifiedPath = ConfigSharedHelpers.GetQualifiedPath(site.Labware, parentFilePath, HxRegHelper.LabwarePath);
				string relativeToDefault = ConfigSharedHelpers.GetRelativeToDefault(qualifiedPath, HxRegHelper.LabwarePath);
				if (!string.IsNullOrEmpty(relativeToDefault))
				{
					hxConfigFile.PutStringValueInDataDef(dataDef, dataVersion, dataInstance, $"Site.{siteNumber.ToString()}.LabwareFile", relativeToDefault);
				}
				string relativeToParent = ConfigSharedHelpers.GetRelativeToParent(qualifiedPath, parentFilePath, HxRegHelper.LabwarePath);
				if (!string.IsNullOrEmpty(relativeToParent))
				{
					hxConfigFile.PutStringValueInDataDef(dataDef, dataVersion, dataInstance, $"Site.{siteNumber.ToString()}.LabwareFileRel", relativeToParent);
				}
			}
			else if (template.AssignedRackStatus[site.LabwareRelative] == AssignedLabwareStatus.FoundUsingRelativePath)
			{
				hxConfigFile.PutStringValueInDataDef(dataDef, dataVersion, dataInstance, $"Site.{siteNumber.ToString()}.LabwareFileRel", site.LabwareRelative);
				string relativeToDefault = ConfigSharedHelpers.GetRelativeToDefault(ConfigSharedHelpers.GetQualifiedPath(site.LabwareRelative, parentFilePath, HxRegHelper.LabwarePath), HxRegHelper.LabwarePath);
				if (!string.IsNullOrEmpty(relativeToDefault))
				{
					hxConfigFile.PutStringValueInDataDef(dataDef, dataVersion, dataInstance, $"Site.{siteNumber.ToString()}.LabwareFile", relativeToDefault);
				}
			}
			else
			{
				hxConfigFile.PutStringValueInDataDef(dataDef, dataVersion, dataInstance, $"Site.{siteNumber.ToString()}.LabwareFile", site.Labware);
				hxConfigFile.PutStringValueInDataDef(dataDef, dataVersion, dataInstance, $"Site.{siteNumber.ToString()}.LabwareFileRel", site.LabwareRelative);
			}
		}
		hxConfigFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, $"Site.{siteNumber.ToString()}.Dx", site.Dimensions.X);
		hxConfigFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, $"Site.{siteNumber.ToString()}.Dy", site.Dimensions.Y);
		hxConfigFile.PutStringValueInDataDef(dataDef, dataVersion, dataInstance, $"Site.{siteNumber.ToString()}.Id", site.Id);
		short iValue = (site.IsCovered ? ((short)1) : ((short)0));
		hxConfigFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, $"Site.{siteNumber.ToString()}.IsCovered", iValue);
		iValue = (site.Label ? ((short)1) : ((short)0));
		hxConfigFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, $"Site.{siteNumber.ToString()}.Label", iValue);
		hxConfigFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, $"Site.{siteNumber.ToString()}.Posn", (short)site.Position);
		iValue = (site.SnapBase ? ((short)1) : ((short)0));
		hxConfigFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, $"Site.{siteNumber.ToString()}.SnapBase", iValue);
		iValue = (site.IsStack ? ((short)1) : ((short)0));
		hxConfigFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, $"Site.{siteNumber.ToString()}.Stack", iValue);
		hxConfigFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, $"Site.{siteNumber.ToString()}.StackSize", (short)site.StackSize);
		iValue = (site.Visible ? ((short)1) : ((short)0));
		hxConfigFile.PutShortValueInDataDef(dataDef, dataVersion, dataInstance, $"Site.{siteNumber.ToString()}.Visible", iValue);
		hxConfigFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, $"Site.{siteNumber.ToString()}.X", site.OffsetsToParentOrigin.X);
		hxConfigFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, $"Site.{siteNumber.ToString()}.Y", site.OffsetsToParentOrigin.Y);
		hxConfigFile.PutDoubleValueInDataDef(dataDef, dataVersion, dataInstance, $"Site.{siteNumber.ToString()}.Z", site.OffsetsToParentOrigin.Z);
	}

	private static void WriteCover(Rack rack, string coverFullPath)
	{
		HxCfgFileClass hxCfgFileClass = new HxCfgFileClass();
		string iDataDefName = "COVER";
		string iInstanceName = "default";
		short iVersionNum = 1;
		hxCfgFileClass.PutStringValueInDataDef(iDataDefName, iVersionNum, iInstanceName, "ViewName", rack.Cover.Name);
		hxCfgFileClass.PutStringValueInDataDef(iDataDefName, iVersionNum, iInstanceName, "Description", rack.Cover.Description);
		if (!string.IsNullOrEmpty(rack.Cover.Bitmap))
		{
			string qualifiedPath = ConfigSharedHelpers.GetQualifiedPath(rack.Cover.Bitmap, coverFullPath, HxRegHelper.LabwarePath);
			string relativeToDefault = ConfigSharedHelpers.GetRelativeToDefault(qualifiedPath, HxRegHelper.LabwarePath);
			if (!string.IsNullOrEmpty(relativeToDefault))
			{
				hxCfgFileClass.PutStringValueInDataDef(iDataDefName, iVersionNum, iInstanceName, "Bitmap", relativeToDefault);
			}
			string relativeToParent = ConfigSharedHelpers.GetRelativeToParent(qualifiedPath, coverFullPath, HxRegHelper.LabwarePath);
			if (!string.IsNullOrEmpty(relativeToParent))
			{
				hxCfgFileClass.PutStringValueInDataDef(iDataDefName, iVersionNum, iInstanceName, "BitmapRel", relativeToParent);
			}
		}
		if (!string.IsNullOrEmpty(rack.Cover.Image))
		{
			string qualifiedPath2 = ConfigSharedHelpers.GetQualifiedPath(rack.Cover.Image, coverFullPath, HxRegHelper.LabwarePath);
			string relativeToDefault = ConfigSharedHelpers.GetRelativeToDefault(qualifiedPath2, HxRegHelper.LabwarePath);
			if (!string.IsNullOrEmpty(relativeToDefault))
			{
				hxCfgFileClass.PutStringValueInDataDef(iDataDefName, iVersionNum, iInstanceName, "Image3D", relativeToDefault);
			}
			string relativeToParent = ConfigSharedHelpers.GetRelativeToParent(qualifiedPath2, coverFullPath, HxRegHelper.LabwarePath);
			if (!string.IsNullOrEmpty(relativeToParent))
			{
				hxCfgFileClass.PutStringValueInDataDef(iDataDefName, iVersionNum, iInstanceName, "ImageRel", relativeToParent);
			}
		}
		if (!string.IsNullOrEmpty(rack.Cover.Model))
		{
			string qualifiedPath3 = ConfigSharedHelpers.GetQualifiedPath(rack.Cover.Model, coverFullPath, HxRegHelper.LabwarePath);
			string relativeToDefault = ConfigSharedHelpers.GetRelativeToDefault(qualifiedPath3, HxRegHelper.LabwarePath);
			if (!string.IsNullOrEmpty(relativeToDefault))
			{
				hxCfgFileClass.PutStringValueInDataDef(iDataDefName, iVersionNum, iInstanceName, "3DModel", relativeToDefault);
			}
			string relativeToParent = ConfigSharedHelpers.GetRelativeToParent(qualifiedPath3, coverFullPath, HxRegHelper.LabwarePath);
			if (!string.IsNullOrEmpty(relativeToParent))
			{
				hxCfgFileClass.PutStringValueInDataDef(iDataDefName, iVersionNum, iInstanceName, "3DModelRel", relativeToParent);
			}
			hxCfgFileClass.PutDoubleValueInDataDef(iDataDefName, iVersionNum, iInstanceName, "3DxOffset", rack.Cover.ModelOffsets.X);
			hxCfgFileClass.PutDoubleValueInDataDef(iDataDefName, iVersionNum, iInstanceName, "3DyOffset", rack.Cover.ModelOffsets.Y);
			hxCfgFileClass.PutDoubleValueInDataDef(iDataDefName, iVersionNum, iInstanceName, "3DzOffset", rack.Cover.ModelOffsets.Z);
		}
		hxCfgFileClass.PutDoubleValueInDataDef(iDataDefName, iVersionNum, iInstanceName, "Dim.Dx", rack.Cover.Dimensions.X);
		hxCfgFileClass.PutDoubleValueInDataDef(iDataDefName, iVersionNum, iInstanceName, "Dim.Dy", rack.Cover.Dimensions.Y);
		hxCfgFileClass.PutDoubleValueInDataDef(iDataDefName, iVersionNum, iInstanceName, "Dim.Dz", rack.Cover.Dimensions.Z);
		hxCfgFileClass.PutDoubleValueInDataDef(iDataDefName, iVersionNum, iInstanceName, "CoverThickness", rack.Cover.Thickness);
		hxCfgFileClass.PutDoubleValueInDataDef(iDataDefName, iVersionNum, iInstanceName, "StackHt", rack.Cover.StackHeight);
		hxCfgFileClass.PutDoubleValueInDataDef(iDataDefName, iVersionNum, iInstanceName, "RackBaseToCoverBase", rack.Cover.RackBaseToCoverBase);
		hxCfgFileClass.PutDoubleValueInDataDef(iDataDefName, iVersionNum, iInstanceName, "CoveredStackHt", rack.Cover.CoveredRackStackHeight);
		if (rack.Cover.OverrideExtent)
		{
			hxCfgFileClass.PutDoubleValueInDataDef(iDataDefName, iVersionNum, iInstanceName, "XExtent", rack.Cover.OverriddenExtent.X);
			hxCfgFileClass.PutDoubleValueInDataDef(iDataDefName, iVersionNum, iInstanceName, "YExtent", rack.Cover.OverriddenExtent.Y);
		}
		else
		{
			hxCfgFileClass.PutDoubleValueInDataDef(iDataDefName, iVersionNum, iInstanceName, "XExtent", rack.Dimensions.X);
			hxCfgFileClass.PutDoubleValueInDataDef(iDataDefName, iVersionNum, iInstanceName, "YExtent", rack.Dimensions.Y);
		}
		hxCfgFileClass.SerializeFile(coverFullPath, 1);
		hxCfgFileClass = null;
	}

	private static bool SetLabwareValidation(Labware labware)
	{
		try
		{
			HxSecurityComHelper.SetFileValidation(labware.LabwareFileFullPath, FileValidation.Valid);
		}
		catch (Exception)
		{
			throw;
		}
		return true;
	}

	private static string BackUpLabwareFile(string fullFilePath)
	{
		string tempPath = Path.GetTempPath();
		string fileName = Path.GetFileName(fullFilePath);
		string text = Path.Combine(tempPath, fileName);
		File.Copy(fullFilePath, text, overwrite: true);
		return text;
	}

	private static void RestoreBackedUpFile(string backUpFullFilePath, string destinationFullFilePath)
	{
		File.Copy(backUpFullFilePath, destinationFullFilePath, overwrite: true);
		File.Delete(backUpFullFilePath);
	}

	private static string SerializeCategoryNode(CategoryNode categoryNode)
	{
		return string.Join(",", categoryNode.Id, categoryNode.ParentCategoryId, categoryNode.ViewName.Replace(",", "\\,"), "default.bmp");
	}

	private static string SerializeLabwareIndexData(LabwareIndexData labwareIndexData)
	{
		return string.Join(",", labwareIndexData.CategoryId.ToString(), labwareIndexData.Name.Replace(",", "\\,"), labwareIndexData.Description.Replace(",", "\\,"), labwareIndexData.FileNameWithExtension, labwareIndexData.FilePathVectorRelative);
	}
}
