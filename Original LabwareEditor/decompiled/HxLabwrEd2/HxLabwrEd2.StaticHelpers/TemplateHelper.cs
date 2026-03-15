using HxLabwrEd2.ConfigFileWritingAndReading;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.StaticHelpers;

public static class TemplateHelper
{
	public static void UpdateAssignedLabwarePaths(Template template, string oldFullLabwarePath)
	{
		if (template == null)
		{
			return;
		}
		foreach (Site site in template.Sites)
		{
			if (!string.IsNullOrEmpty(site.LabwareRelative) && template.AssignedRackStatus.ContainsKey(site.LabwareRelative))
			{
				if (template.AssignedRackStatus[site.LabwareRelative] == AssignedLabwareStatus.FoundUsingAbsolutePath)
				{
					site.Labware = PathHelper.GenerateNewFullFilePathBasedOnParent(site.Labware, template.LabwareFileFullPath);
					site.LabwareRelative = PathHelper.GenerateNewRelativePath(site.Labware, site.LabwareRelative, template.LabwareFileFullPath);
				}
				else if (template.AssignedRackStatus[site.LabwareRelative] == AssignedLabwareStatus.FoundUsingRelativePath && !string.IsNullOrEmpty(oldFullLabwarePath))
				{
					site.LabwareRelative = PathHelper.GenerateNewRelativePath(site.Labware, site.LabwareRelative, template.LabwareFileFullPath, oldFullLabwarePath);
					site.Labware = PathHelper.GenerateNewFullFilePathBasedOnParent(site.Labware, oldFullLabwarePath);
				}
			}
		}
		ConfigFileReader.UpdateTemplateAssignedRackStatus(template);
	}
}
