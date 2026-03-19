namespace HxLabwrEd2.StaticHelpers;

internal static class BarcodeHelper
{
	private static readonly char noBcAllowedChar = '$';

	private static readonly char escapeChar = '\\';

	private static readonly char wildCardChar = '%';

	public static bool IsBarcodeMaskValid(string barcodeMask)
	{
		string errorDescription;
		return IsBarcodeMaskValid(barcodeMask, out errorDescription);
	}

	public static bool IsBarcodeMaskValid(string barcodeMask, out string errorDescription)
	{
		if (string.IsNullOrEmpty(barcodeMask))
		{
			errorDescription = "Barcode mask cannot be empty.";
			return false;
		}
		if (barcodeMask[0] == noBcAllowedChar && barcodeMask.Length > 1)
		{
			errorDescription = "No Barcode Allowed character must be the only character present in the barcode mask.";
			return false;
		}
		bool flag = false;
		int num = 0;
		int num2 = 0;
		for (int i = 0; i < barcodeMask.Length; i++)
		{
			if (barcodeMask[i] == escapeChar)
			{
				i++;
				if (i >= barcodeMask.Length)
				{
					flag = true;
				}
				continue;
			}
			if (barcodeMask[i] == wildCardChar)
			{
				num++;
			}
			if (i > 0 && barcodeMask[i] == noBcAllowedChar)
			{
				num2++;
			}
		}
		if (num2 > 0)
		{
			errorDescription = "No Barcode Allowed character must be the only character present in the barcode mask.";
			return false;
		}
		if (num > 1)
		{
			errorDescription = "Wild Card character may only be used once in the barcode mask.";
			return false;
		}
		if (flag)
		{
			errorDescription = "Barcode mask cannot end with the Escape Character.";
			return false;
		}
		errorDescription = "";
		return true;
	}
}
