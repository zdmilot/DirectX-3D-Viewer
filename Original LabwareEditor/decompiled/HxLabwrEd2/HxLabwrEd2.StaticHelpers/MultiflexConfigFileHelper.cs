using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Xml;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.StaticHelpers;

public static class MultiflexConfigFileHelper
{
	public static Dictionary<string, CarrierConfig> ReadCarrierConfigFile(string fullFilePath)
	{
		if (!File.Exists(fullFilePath))
		{
			throw new Exception(Path.GetFileName(fullFilePath) + " was not found in " + Path.GetDirectoryName(fullFilePath) + " folder.");
		}
		Dictionary<string, CarrierConfig> dictionary = new Dictionary<string, CarrierConfig>();
		XmlDocument xmlDocument = new XmlDocument();
		xmlDocument.Load(fullFilePath);
		foreach (XmlNode childNode in xmlDocument.DocumentElement.SelectSingleNode("/carrierConfig").ChildNodes)
		{
			CarrierConfig carrierConfig = new CarrierConfig();
			carrierConfig.DisplayName = childNode.Attributes["displayName"].Value;
			if (childNode.Attributes["displayPartNumber"] != null)
			{
				carrierConfig.DisplayPartNumber = childNode.Attributes["displayPartNumber"].Value;
			}
			carrierConfig.ImageFilePath = HxRegHelper.LabwarePath + "\\" + childNode.Attributes["imageFilePath"].Value;
			carrierConfig.ModelFilePath = HxRegHelper.LabwarePath + "\\" + childNode.Attributes["modelFilePath"].Value;
			string[] array = childNode.Attributes["dimensions"].Value.Split(',');
			carrierConfig.Dimensions.X = double.Parse(array[0], CultureInfo.InvariantCulture);
			carrierConfig.Dimensions.Y = double.Parse(array[1], CultureInfo.InvariantCulture);
			carrierConfig.Dimensions.Z = double.Parse(array[2], CultureInfo.InvariantCulture);
			array = childNode.Attributes["modelOffsets"].Value.Split(',');
			carrierConfig.ModelOffsets.X = double.Parse(array[0], CultureInfo.InvariantCulture);
			carrierConfig.ModelOffsets.Y = double.Parse(array[1], CultureInfo.InvariantCulture);
			carrierConfig.ModelOffsets.Z = double.Parse(array[2], CultureInfo.InvariantCulture);
			array = childNode.Attributes["sitePedestalTypes"].Value.Replace("[", string.Empty).Replace("]", string.Empty).Split(';');
			string[] array2 = array;
			foreach (string item in array2)
			{
				carrierConfig.PedestalTypes.Add(item);
			}
			array = childNode.Attributes["sitePedestalOffsets"].Value.Replace("[", string.Empty).Replace("]", string.Empty).Split(';');
			array2 = array;
			for (int i = 0; i < array2.Length; i++)
			{
				string[] array3 = array2[i].Split(',');
				carrierConfig.PedestalOffsets.Add(new Offsets(double.Parse(array3[0], CultureInfo.InvariantCulture), double.Parse(array3[1], CultureInfo.InvariantCulture), double.Parse(array3[2], CultureInfo.InvariantCulture)));
			}
			if (childNode.Attributes["loadable"] != null)
			{
				string value = childNode.Attributes["loadable"].Value;
				carrierConfig.Loadable = int.Parse(value) == 1;
			}
			if (carrierConfig.Loadable)
			{
				carrierConfig.BarcodeMask = childNode.Attributes["barcodeMask"].Value;
			}
			if (childNode.Attributes["modelEdgeOffsets"] != null)
			{
				array = childNode.Attributes["modelEdgeOffsets"].Value.Split(',');
				carrierConfig.ModelEdgeOffsets = new Offsets(double.Parse(array[0], CultureInfo.InvariantCulture), double.Parse(array[1], CultureInfo.InvariantCulture), double.Parse(array[2], CultureInfo.InvariantCulture));
			}
			if (!dictionary.ContainsKey(carrierConfig.DisplayName))
			{
				dictionary.Add(carrierConfig.DisplayName, carrierConfig);
			}
		}
		return dictionary;
	}

	public static SortedDictionary<string, SortedDictionary<string, Pedestal>> ReadNimbusPedestalsConfigFile(string fullFilePath)
	{
		if (!File.Exists(fullFilePath))
		{
			throw new Exception(Path.GetFileName(fullFilePath) + " was not found in " + Path.GetDirectoryName(fullFilePath) + " folder.");
		}
		SortedDictionary<string, SortedDictionary<string, Pedestal>> sortedDictionary = new SortedDictionary<string, SortedDictionary<string, Pedestal>>();
		XmlDocument xmlDocument = new XmlDocument();
		xmlDocument.Load(fullFilePath);
		foreach (XmlNode childNode in xmlDocument.DocumentElement.SelectSingleNode("/pedestalConfig").ChildNodes)
		{
			string value = childNode.Attributes["displayName"].Value;
			string partNumber = string.Empty;
			if (childNode.Attributes["displayPartNumber"] != null)
			{
				partNumber = childNode.Attributes["displayPartNumber"].Value;
			}
			string templateFilePath = HxRegHelper.LabwarePath + "\\" + childNode.Attributes["templateFilePath"].Value;
			string modelFilePath = HxRegHelper.LabwarePath + "\\" + childNode.Attributes["modelFilePath"].Value;
			string imageFilePath = HxRegHelper.LabwarePath + "\\" + childNode.Attributes["imageFilePath"].Value;
			string[] array = childNode.Attributes["pedestalType"].Value.Split(',');
			foreach (string text in array)
			{
				if (!sortedDictionary.ContainsKey(text))
				{
					sortedDictionary.Add(text, new SortedDictionary<string, Pedestal>());
				}
				sortedDictionary[text].Add(value, new Pedestal(value, partNumber, text, templateFilePath, modelFilePath, imageFilePath));
			}
		}
		return sortedDictionary;
	}

	public static SortedDictionary<string, SortedDictionary<string, Pedestal>> ReadStarPedestalsConfigFile(string fullFilePath)
	{
		if (!File.Exists(fullFilePath))
		{
			throw new Exception(Path.GetFileName(fullFilePath) + " was not found in " + Path.GetDirectoryName(fullFilePath) + " folder.");
		}
		SortedDictionary<string, SortedDictionary<string, Pedestal>> sortedDictionary = new SortedDictionary<string, SortedDictionary<string, Pedestal>>();
		XmlDocument xmlDocument = new XmlDocument();
		xmlDocument.Load(fullFilePath);
		foreach (XmlNode childNode in xmlDocument.DocumentElement.SelectSingleNode("/pedestalConfig").ChildNodes)
		{
			string value = childNode.Attributes["displayName"].Value;
			string partNumber = string.Empty;
			if (childNode.Attributes["displayPartNumber"] != null)
			{
				partNumber = childNode.Attributes["displayPartNumber"].Value;
			}
			string templateFilePath = HxRegHelper.LabwarePath + "\\" + childNode.Attributes["templateFilePath"].Value;
			string modelFilePath = ((childNode.Attributes["modelFilePath"] == null) ? null : (HxRegHelper.LabwarePath + "\\" + childNode.Attributes["modelFilePath"].Value));
			string imageFilePath = HxRegHelper.LabwarePath + "\\" + childNode.Attributes["imageFilePath"].Value;
			Offsets offsets = new Offsets();
			if (childNode.Attributes["modelOffsetsOverride"] != null)
			{
				string[] array = childNode.Attributes["modelOffsetsOverride"].Value.Split(',');
				offsets.X = double.Parse(array[0], CultureInfo.InvariantCulture);
				offsets.Y = double.Parse(array[1], CultureInfo.InvariantCulture);
			}
			Offsets offsets2 = new Offsets();
			if (childNode.Attributes["sitesOffsetsOverride"] != null)
			{
				string[] array2 = childNode.Attributes["sitesOffsetsOverride"].Value.Split(',');
				offsets2.X = double.Parse(array2[0], CultureInfo.InvariantCulture);
				offsets2.Y = double.Parse(array2[1], CultureInfo.InvariantCulture);
			}
			List<int> list = new List<int>();
			string[] array3;
			if (childNode.Attributes["oversized"] != null)
			{
				array3 = childNode.Attributes["oversized"].Value.Replace("[", string.Empty).Replace("]", string.Empty).Split(',');
				foreach (string s in array3)
				{
					list.Add(int.Parse(s));
				}
			}
			array3 = childNode.Attributes["pedestalType"].Value.Split(',');
			foreach (string text in array3)
			{
				if (!sortedDictionary.ContainsKey(text))
				{
					sortedDictionary.Add(text, new SortedDictionary<string, Pedestal>());
				}
				sortedDictionary[text].Add(value, new Pedestal(value, partNumber, text, templateFilePath, modelFilePath, imageFilePath, offsets, offsets2, list));
			}
		}
		return sortedDictionary;
	}
}
