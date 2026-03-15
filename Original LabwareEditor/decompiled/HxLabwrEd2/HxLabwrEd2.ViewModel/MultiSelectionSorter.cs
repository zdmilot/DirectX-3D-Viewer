using System;
using System.Collections.Generic;
using System.Linq;
using HxLabwrEd2.Extensions;

namespace HxLabwrEd2.ViewModel;

public class MultiSelectionSorter : IComparer<string>
{
	public int Compare(string x, string y)
	{
		if (IsNumeric(x) && IsNumeric(y))
		{
			return Convert.ToInt32(x) - Convert.ToInt32(y);
		}
		string pattern = "(?<AlphabeticPart>[A-Z]*)(?<NumericPart>[0-9]*)";
		string namedGroup = RegexMatching.GetNamedGroup(x, pattern, "AlphabeticPart");
		string namedGroup2 = RegexMatching.GetNamedGroup(y, pattern, "AlphabeticPart");
		string namedGroup3 = RegexMatching.GetNamedGroup(x, pattern, "NumericPart");
		string namedGroup4 = RegexMatching.GetNamedGroup(y, pattern, "NumericPart");
		bool flag = namedGroup3.Length != 0 && namedGroup.Length + namedGroup3.Length == x.Length;
		bool flag2 = namedGroup4.Length != 0 && namedGroup2.Length + namedGroup4.Length == y.Length;
		if (flag && flag2)
		{
			if (namedGroup.Length != namedGroup2.Length)
			{
				return namedGroup.Length - namedGroup2.Length;
			}
			if (!string.Equals(namedGroup, namedGroup2))
			{
				return string.CompareOrdinal(namedGroup, namedGroup2);
			}
			return Convert.ToInt32(namedGroup3) - Convert.ToInt32(namedGroup4);
		}
		if (flag)
		{
			return -1;
		}
		if (flag2)
		{
			return 1;
		}
		return string.Compare(x, y);
	}

	private bool IsNumeric(string testString)
	{
		return testString.All((char c) => c >= '0' && c <= '9');
	}
}
