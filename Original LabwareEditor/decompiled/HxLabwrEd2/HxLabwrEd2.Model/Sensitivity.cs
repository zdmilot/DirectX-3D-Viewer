using System.ComponentModel;

namespace HxLabwrEd2.Model;

[TypeConverter(typeof(EnumBindingSourceExtension.EnumDescriptionTypeConverter))]
public enum Sensitivity
{
	[Description("1 - Very High")]
	VeryHigh = 1,
	[Description("2 - High")]
	High,
	[Description("3 - Medium")]
	Medium,
	[Description("4 - Low")]
	Low
}
