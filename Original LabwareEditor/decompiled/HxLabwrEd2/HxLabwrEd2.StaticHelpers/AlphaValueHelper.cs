namespace HxLabwrEd2.StaticHelpers;

public static class AlphaValueHelper
{
	public static string IncrementAlphaValue(string input)
	{
		char c;
		char c2;
		if (input.Length == 1)
		{
			if (input == "Z")
			{
				return "AA";
			}
			c = input[0];
			c2 = (c = (char)(c + 1));
			return c2.ToString();
		}
		c = input[0];
		char c3 = input[1];
		if (c3 == 'Z')
		{
			c2 = (c = (char)(c + 1));
			return c2 + "A";
		}
		string text = c.ToString();
		c2 = (c3 = (char)(c3 + 1));
		return text + c2;
	}

	public static string IncrementAlphaValue(string input, int timesToIncrement)
	{
		string text = input;
		for (int i = 0; i < timesToIncrement; i++)
		{
			text = IncrementAlphaValue(text);
		}
		return text;
	}

	public static string DecrementAlphaValue(string input)
	{
		if (input.Length == 1)
		{
			return ((char)(input[0] - 1)).ToString();
		}
		char c = input[0];
		char c2 = input[1];
		char c3;
		if (c2 == 'A')
		{
			if (c == 'A')
			{
				return "Z";
			}
			c3 = (c = (char)(c - 1));
			return c3 + "Z";
		}
		string text = c.ToString();
		c3 = (c2 = (char)(c2 - 1));
		return text + c3;
	}

	public static string DecrementAlphaValue(string input, int timerToDecrement)
	{
		string text = input;
		for (int i = 0; i < timerToDecrement; i++)
		{
			text = DecrementAlphaValue(text);
		}
		return text;
	}
}
