using System;
using System.IO;
using System.Linq.Expressions;
using System.Windows;
using System.Windows.Forms;
using System.Windows.Threading;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.CommandWpf;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Messaging;
using GongSolutions.Wpf.DragDrop;
using HxLabwrEd2.StaticHelpers;
using Microsoft.Win32;

namespace HxLabwrEd2.ViewModel;

public class TitlePageViewModel : ViewModelBase, IDropTarget
{
	private readonly string chmFileName = "HxLabwrEd2Enu.chm";

	private string userName;

	private bool internalLogon;

	private bool commandLineArgsHandled;

	private bool chmFileFound;

	public string UserName
	{
		get
		{
			return userName;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => UserName), ref userName, value);
		}
	}

	public bool InternalLogon
	{
		get
		{
			return internalLogon;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => InternalLogon), ref internalLogon, value);
		}
	}

	public bool ChmFileFound
	{
		get
		{
			return chmFileFound;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => ChmFileFound), ref chmFileFound, value);
		}
	}

	public RelayCommand AppClose { get; }

	public RelayCommand NavToNewLabwareVM { get; }

	public RelayCommand OpenFile { get; }

	public RelayCommand NavToCatManagerVM { get; }

	public RelayCommand ChangeUser { get; }

	public RelayCommand AppChecks { get; }

	public RelayCommand OpenHelpChm { get; }

	public TitlePageViewModel()
	{
		//IL_001f: Unknown result type (might be due to invalid IL or missing references)
		//IL_0029: Expected O, but got Unknown
		//IL_0037: Unknown result type (might be due to invalid IL or missing references)
		//IL_0041: Expected O, but got Unknown
		//IL_004f: Unknown result type (might be due to invalid IL or missing references)
		//IL_0059: Expected O, but got Unknown
		//IL_0067: Unknown result type (might be due to invalid IL or missing references)
		//IL_0071: Expected O, but got Unknown
		//IL_007f: Unknown result type (might be due to invalid IL or missing references)
		//IL_0089: Expected O, but got Unknown
		//IL_0097: Unknown result type (might be due to invalid IL or missing references)
		//IL_00a1: Expected O, but got Unknown
		//IL_00af: Unknown result type (might be due to invalid IL or missing references)
		//IL_00b9: Expected O, but got Unknown
		AppClose = new RelayCommand((Action)ExecuteAppClose, false);
		NavToNewLabwareVM = new RelayCommand((Action)ExecuteNavToNewLabwareVM, false);
		OpenFile = new RelayCommand((Action)ExecuteOpenFile, false);
		NavToCatManagerVM = new RelayCommand((Action)ExecuteNavToCatManagerVM, false);
		ChangeUser = new RelayCommand((Action)ExecuteChangeUser, false);
		AppChecks = new RelayCommand((Action)ExecuteAppChecks, false);
		OpenHelpChm = new RelayCommand((Action)ExecuteOpenHelpChm, false);
		ChmFileFound = File.Exists(HxRegHelper.BinPath + "\\" + chmFileName);
		InitializeLoadedViewModels();
		Messenger.Default.Register<GenericMessage<string>>((object)this, (object)"LoadDraggedInLabwareFile", (Action<GenericMessage<string>>)delegate(GenericMessage<string> msg)
		{
			LoadDraggeInLabwareFile(msg.Content);
		}, false);
	}

	private void ExecuteAppClose()
	{
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"AppClose");
	}

	private void ExecuteNavToNewLabwareVM()
	{
		Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<NewLabwareViewModel>()), (object)"Navigation");
	}

	private void ExecuteOpenFile()
	{
		DragDropFileLoadHelper.OpenFileDlgReference = new Microsoft.Win32.OpenFileDialog
		{
			InitialDirectory = HxRegHelper.LabwarePath,
			Filter = "Labware (*.crk,*.ctr,*.rck,*.tml)|*.crk;*.ctr;*.rck;*.tml|Circular Rack (*.crk)|*.crk|Container (*.ctr)|*.ctr|Rectangular Rack (*.rck)|*.rck|Template or Nimbus Carrier (*.tml)|*.tml"
		};
		bool? flag = DragDropFileLoadHelper.OpenFileDlgReference.ShowDialog();
		string fileName = DragDropFileLoadHelper.OpenFileDlgReference.FileName;
		DragDropFileLoadHelper.OpenFileDlgReference = null;
		if (flag == true)
		{
			LoadLabwareFile(fileName);
		}
	}

	public void DragOver(IDropInfo dropInfo)
	{
		if (DragDropFileLoadHelper.OpenFileDlgReference == null)
		{
			DragDropFileLoadHelper.DragOver(dropInfo);
		}
	}

	public void Drop(IDropInfo dropInfo)
	{
		if (DragDropFileLoadHelper.OpenFileDlgReference == null && (dropInfo.Data as System.Windows.DataObject).ContainsFileDropList() && DragDropFileLoadHelper.TryGetFirstValidFileName(dropInfo.Data as System.Windows.DataObject, out var firstValidFileName))
		{
			LoadLabwareFile(firstValidFileName);
		}
	}

	public void LoadDraggeInLabwareFile(string filePath)
	{
		LoadLabwareFile(filePath);
	}

	private void ExecuteNavToCatManagerVM()
	{
		if (false)
		{
			CatManagerViewModel instance = SimpleIoc.Default.GetInstance<CatManagerViewModel>();
			Messenger.Default.Send<GenericMessage<bool>>(new GenericMessage<bool>(false), (object)"LoadLabwareCategoryManager");
			Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)instance), (object)"Navigation");
		}
		else
		{
			Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<CategoryFilterManagerViewModel>()), (object)"Navigation");
		}
	}

	private void ExecuteAppChecks()
	{
		AppAccessCheck();
		AppCommandLineArgsCheck();
	}

	private void ExecuteOpenHelpChm()
	{
		Help.ShowHelp(null, "file://" + HxRegHelper.BinPath + "\\" + chmFileName);
	}

	private void AppAccessCheck()
	{
		SecurityAndConfigurationManager.AppAccessCheck();
	}

	private void AppCommandLineArgsCheck()
	{
		if (!commandLineArgsHandled)
		{
			if (!string.IsNullOrEmpty(CommandLineArgumentHelper.FirstLabwarePath))
			{
				LoadLabwareFile(CommandLineArgumentHelper.FirstLabwarePath);
			}
			else if (CommandLineArgumentHelper.CategoryFilterManager)
			{
				ExecuteNavToCatManagerVM();
			}
			else if (CommandLineArgumentHelper.StartupEventArgs != null && CommandLineArgumentHelper.StartupEventArgs.Args != null && CommandLineArgumentHelper.StartupEventArgs.Args.Length != 0)
			{
				string errMsg;
				if (CommandLineArgumentHelper.ArgsContainFullPath)
				{
					errMsg = "Unsupported file format(s) detected, unable to open provided file(s)!";
				}
				else
				{
					errMsg = "Unable to process provided command line arguments!\n\nSupported command line arguments:\n- Full path to a labware file (*.crk, *.ctr, *.rck, *.tml)\n- (optional, with full labware path) \"limited\" keyword to open labware file in\n  read only mode and close HxLabwrEd2.exe after \"Close\" button is clicked\n- \"CategoryFilterManager\" to open Category Filter Manager";
				}
				System.Windows.Application.Current.Dispatcher.BeginInvoke((Action)delegate
				{
					DialogWindowHelper.ShowDialogWithProportionalDimensions("Error!", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogSimpleWarningViewModel>(), errMsg, 0.35, CommandLineArgumentHelper.ArgsContainFullPath ? 0.2 : 0.35);
				}, DispatcherPriority.Background, null);
			}
		}
		commandLineArgsHandled = true;
	}

	private void ExecuteChangeUser()
	{
		SecurityAndConfigurationManager.ChangeUser();
	}

	private void InitializeLoadedViewModels()
	{
		SimpleIoc.Default.GetInstance<LoadedTemplateViewModel>();
		SimpleIoc.Default.GetInstance<LoadedRectangularRackViewModel>();
		SimpleIoc.Default.GetInstance<LoadedContainerViewModel>();
		SimpleIoc.Default.GetInstance<LoadedCircularRackViewModel>();
	}

	private void LoadLabwareFile(string filePath)
	{
		LoadLabwareHelper.LoadLabware(filePath);
	}
}
