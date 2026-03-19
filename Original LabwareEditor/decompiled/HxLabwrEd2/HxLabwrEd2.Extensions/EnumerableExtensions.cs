using System;
using System.Collections.Generic;

namespace HxLabwrEd2.Extensions;

public static class EnumerableExtensions
{
	public static void Each<T>(this IEnumerable<T> ie, Action<T, int> action)
	{
		int num = 0;
		foreach (T item in ie)
		{
			action(item, num++);
		}
	}
}
