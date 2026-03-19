using HxLabwrEd2.ConfigFileWritingAndReading;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.StaticHelpers;

public static class PathHelper
{
	public static string GenerateNewRelativePath(string fullPath, string oldRelativePath, string parentLabwarePath, string oldParentLabwarePath = null)
	{
		return GenerateNewRelativePath(fullPath, parentLabwarePath, oldRelativePath, oldParentLabwarePath, null);
	}

	public static string GenerateNewRelativePath(Rack rack, string oldParentLabwarePath)
	{
		return GenerateNewRelativePath(rack.SingleRepeatingContainer.FilePath, rack.LabwareFileFullPath, rack.SingleRepeatingContainer.RelativeFilePath, oldParentLabwarePath, rack);
	}

	public static string GenerateNewRelativePath(RackWell rackWell, string parentLabwarePath, string oldParentLabwarePath)
	{
		return GenerateNewRelativePath(rackWell.ContainerFilePath, parentLabwarePath, rackWell.ContainerRelativeFilePath, oldParentLabwarePath, null);
	}

	public static string GenerateNewFullFilePathBasedOnParent(string path, string ParentLabwarePath)
	{
		return ConfigSharedHelpers.GetRelativeToDefault(ConfigSharedHelpers.GetQualifiedPath(path, ParentLabwarePath, HxRegHelper.LabwarePath), HxRegHelper.LabwarePath);
	}

	private static string GenerateNewRelativePath(string fullPath, string parentLabwarePath, string oldRelativePath, string oldParentLabwarePath, Labware labware)
	{
		if (string.IsNullOrWhiteSpace(fullPath))
		{
			return string.Empty;
		}
		bool flag = labware != null && labware is Rack;
		string relativeToParent = ConfigSharedHelpers.GetRelativeToParent(ConfigSharedHelpers.GetQualifiedPath(fullPath, parentLabwarePath, HxRegHelper.LabwarePath), parentLabwarePath, HxRegHelper.LabwarePath);
		if (string.IsNullOrEmpty(parentLabwarePath) || string.IsNullOrWhiteSpace(relativeToParent))
		{
			return fullPath;
		}
		if (!string.IsNullOrEmpty(oldParentLabwarePath))
		{
			return ConfigSharedHelpers.GetRelativeToParent(ConfigSharedHelpers.GetQualifiedPath(fullPath, oldParentLabwarePath, HxRegHelper.LabwarePath), parentLabwarePath, fullPath);
		}
		if (relativeToParent != oldRelativePath || (flag && oldRelativePath != relativeToParent && (labware as Rack).DrawContainers.ContainsKey(oldRelativePath) && (labware as Rack).DrawContainers[oldRelativePath].FilePath != fullPath))
		{
			return relativeToParent;
		}
		return oldRelativePath;
	}
}
