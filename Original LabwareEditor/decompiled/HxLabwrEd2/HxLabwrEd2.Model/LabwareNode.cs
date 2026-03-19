namespace HxLabwrEd2.Model;

public class LabwareNode : TreeNode
{
	public LabwareNodeData LabwareNodeData { get; set; }

	public int CategoryId { get; }

	public LabwareNode(LabwareNodeData labwareNodeData, int categoryId = 0)
		: base(childrenAllowed: false, dragDropAllowed: false, filteringAllowed: true)
	{
		LabwareNodeData = labwareNodeData;
		base.ViewName = labwareNodeData.ViewName;
		CategoryId = categoryId;
	}

	public LabwareNode(string viewName = "", int categoryId = 0)
		: base(childrenAllowed: false, dragDropAllowed: false, filteringAllowed: true)
	{
		base.ViewName = viewName;
		CategoryId = categoryId;
	}
}
