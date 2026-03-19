namespace HxLabwrEd2.Model;

public class LabwareIndexData
{
	public int CategoryId { get; set; }

	public string Name { get; set; }

	public string Description { get; set; }

	public string FileNameWithExtension { get; set; }

	public string FilePathVectorRelative { get; set; }

	public LabwareIndexData(int categoryId, string filePathVectorRelative)
	{
		CategoryId = categoryId;
		FilePathVectorRelative = filePathVectorRelative;
	}

	public LabwareIndexData(int categoryId, string name, string description, string fileNameWithExtension, string filePathVectorRelative)
	{
		CategoryId = categoryId;
		Name = name;
		Description = description;
		FileNameWithExtension = fileNameWithExtension;
		FilePathVectorRelative = filePathVectorRelative;
	}
}
