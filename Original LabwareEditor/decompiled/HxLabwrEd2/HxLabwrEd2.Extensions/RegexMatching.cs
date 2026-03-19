using System;
using System.Text.RegularExpressions;

namespace HxLabwrEd2.Extensions;

public static class RegexMatching
{
	public static MatchCollection GetMatches(string inputString, string pattern)
	{
		MatchCollection matchCollection = Regex.Matches(inputString, pattern, RegexOptions.Compiled);
		if (matchCollection.Count <= 0)
		{
			throw new Exception("No match found.\n\nPattern:\n\"" + pattern + "\"\nInput String:\n\"" + inputString + "\"");
		}
		return matchCollection;
	}

	public static Match GetFirstMatch(string inputString, string pattern)
	{
		return GetMatches(inputString, pattern)[0];
	}

	public static string GetNamedGroup(string inputString, string pattern, string groupName)
	{
		return GetNamedGroup(GetMatches(inputString, pattern)[0], groupName);
	}

	public static string GetNamedGroup(Match match, string groupName)
	{
		return match.Groups[groupName].Value;
	}
}
