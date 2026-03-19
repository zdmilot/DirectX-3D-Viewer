using System;
using System.Linq;
using Hamilton.Interop.HxReg;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.StaticHelpers;

public static class HxRegHelper
{
	private static readonly HxRegistryClass hxReg = new HxRegistryClass();

	public static string LabwarePath => hxReg.LabwarePath;

	public static string ConfigPath => hxReg.ConfigPath;

	public static string BinPath => hxReg.BinPath;

	public static bool FileValidation => hxReg.FileValidation != 0;

	public static AuditTrail UseAuditTrail => (AuditTrail)hxReg.UseAuditTrail;

	public static bool UseInternalLogon => hxReg.UseInternalLogon != 0;

	public static bool FileProtection => hxReg.FileProtection != 0;

	public static bool CheckSum => hxReg.UseCheckSum != 0;

	public static bool FunctionProtection => hxReg.FunctionProtection != 0;

	public static bool StarInstrumentPresent => InstrumentPresent("star");

	public static bool NimbusInstrumentPresent => InstrumentPresent("nimbus");

	public static string VenusVersion
	{
		get
		{
			hxReg.VenusVersion(out var pVal);
			return pVal;
		}
	}

	private static bool InstrumentPresent(string instrumentSubstringLowerCase)
	{
		hxReg.Instruments(out var pValues);
		return (from current in ((Array)pValues).Cast<string>().ToArray()
			select current.ToLower()).ToArray().Any((string current) => current.Contains(instrumentSubstringLowerCase));
	}
}
