namespace HxLabwrEd2.Model;

public class CategoryNode : TreeNode
{
	public int Id { get; }

	public int ParentCategoryId { get; internal set; }

	public CategoryNode(string viewName = "", int id = 0, int parentCategoryId = 0, string icon = null)
		: base(childrenAllowed: true, dragDropAllowed: true, filteringAllowed: true)
	{
		base.ViewName = viewName;
		Id = id;
		ParentCategoryId = parentCategoryId;
	}

	public CategoryNode(CategoryNodeData categoryNodeData)
		: base(childrenAllowed: true, dragDropAllowed: true, filteringAllowed: true)
	{
		base.ViewName = categoryNodeData.ViewName;
		Id = categoryNodeData.Id;
		ParentCategoryId = categoryNodeData.ParentCategoryId;
	}
}
