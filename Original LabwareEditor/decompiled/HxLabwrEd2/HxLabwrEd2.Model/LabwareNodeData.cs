using System.Collections.Generic;
using System.IO;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.Model;

public class LabwareNodeData
{
	public string ViewName { get; set; }

	public List<int> CategoryIds { get; set; }

	public string Name { get; set; }

	public string Description { get; set; }

	public string FilePath { get; set; }

	public string FilePathVectorRelative { get; set; }

	public string ImagePath { get; set; }

	public FileValidation Validated { get; set; }

	public bool ReadOnly { get; set; }

	public LabwareNodeData()
	{
		CategoryIds = new List<int>();
	}

	public LabwareNodeData(string name, string description, List<int> categoryIds, string imagePath, string filePath, bool readOnly, FileValidation validated = FileValidation.Invalid)
	{
		Name = name;
		Description = description;
		CategoryIds = categoryIds;
		FilePath = filePath;
		ImagePath = imagePath;
		ReadOnly = readOnly;
		Validated = validated;
		if (string.IsNullOrEmpty(name))
		{
			ViewName = Path.GetFileName(filePath);
		}
		else
		{
			ViewName = name;
		}
		FilePathVectorRelative = filePath.Substring(HxRegHelper.LabwarePath.Length).Trim('\\').Replace("\\", "\\\\");
	}
}
