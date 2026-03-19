using System;
using System.ComponentModel;
using System.Globalization;
using System.Reflection;
using System.Windows.Markup;

namespace HxLabwrEd2.Model;

public class EnumBindingSourceExtension : MarkupExtension
{
	public class EnumDescriptionTypeConverter : EnumConverter
	{
		public EnumDescriptionTypeConverter(Type type)
			: base(type)
		{
		}

		public override object ConvertTo(ITypeDescriptorContext context, CultureInfo culture, object value, Type destinationType)
		{
			if (destinationType == typeof(string))
			{
				if (value != null)
				{
					FieldInfo field = value.GetType().GetField(value.ToString());
					if (field != null)
					{
						DescriptionAttribute[] array = (DescriptionAttribute[])field.GetCustomAttributes(typeof(DescriptionAttribute), inherit: false);
						if (array.Length == 0 || string.IsNullOrEmpty(array[0].Description))
						{
							return value.ToString();
						}
						return array[0].Description;
					}
				}
				return string.Empty;
			}
			return base.ConvertTo(context, culture, value, destinationType);
		}
	}

	private Type _enumType;

	public Type EnumType
	{
		get
		{
			return _enumType;
		}
		set
		{
			if (value != _enumType)
			{
				if (null != value && !(Nullable.GetUnderlyingType(value) ?? value).IsEnum)
				{
					throw new ArgumentException("Type must be for an Enum.");
				}
				_enumType = value;
			}
		}
	}

	public EnumBindingSourceExtension()
	{
	}

	public EnumBindingSourceExtension(Type enumType)
	{
		EnumType = enumType;
	}

	public override object ProvideValue(IServiceProvider serviceProvider)
	{
		if (null == _enumType)
		{
			throw new InvalidOperationException("The EnumType must be specified.");
		}
		Type type = Nullable.GetUnderlyingType(_enumType) ?? _enumType;
		Array values = Enum.GetValues(type);
		if (type == _enumType)
		{
			return values;
		}
		Array array = Array.CreateInstance(type, values.Length + 1);
		values.CopyTo(array, 1);
		return array;
	}
}
