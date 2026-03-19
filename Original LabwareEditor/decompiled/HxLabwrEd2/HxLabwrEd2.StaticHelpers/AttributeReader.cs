using System;
using System.ComponentModel;
using System.Linq;

namespace HxLabwrEd2.StaticHelpers;

public static class AttributeReader
{
	public static T GetAttributeOfType<T>(this Enum enumeration) where T : Attribute
	{
		object[] customAttributes = enumeration.GetType().GetMember(enumeration.ToString()).First()
			.GetCustomAttributes(typeof(T), inherit: false);
		if (customAttributes.Length == 0)
		{
			return null;
		}
		return (T)customAttributes.First();
	}

	public static string GetDescription(this Enum enumeration)
	{
		return enumeration.GetAttributeOfType<DescriptionAttribute>().Description;
	}
}
