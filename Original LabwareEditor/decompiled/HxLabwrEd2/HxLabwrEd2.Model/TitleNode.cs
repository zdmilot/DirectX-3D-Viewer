namespace HxLabwrEd2.Model;

public class TitleNode : TreeNode
{
	public static readonly string CategoryLabwareTitleNodeName = "Categories & Categorized Labware";

	public static readonly string UncategorizedLabwareTitleNodeName = "Uncategorized Labware";

	public TitleNode(string viewName = "")
		: base(childrenAllowed: true)
	{
		base.ViewName = viewName;
	}
}
