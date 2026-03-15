namespace HxLabwrEd2.Model;

public class CategoryNodeData
{
	public int Id { get; set; }

	public string ViewName { get; set; }

	public int ParentCategoryId { get; set; }

	public string Icon { get; set; }

	public static int NextAvailableCategoryId { get; private set; }

	public static string VectorGuid { get; private set; }

	public CategoryNodeData(int id = 0, string viewName = "", int parentId = 0, string icon = null)
	{
		Id = id;
		ParentCategoryId = parentId;
		ViewName = viewName;
		Icon = icon;
	}

	public static void SetNextAvailableIdAndGuid(int nextAvailableCategoryId, string vectorGuid)
	{
		NextAvailableCategoryId = nextAvailableCategoryId;
		VectorGuid = vectorGuid;
	}

	public static int GetAndIncrementNextAvailableCategoryId()
	{
		return NextAvailableCategoryId++;
	}
}
