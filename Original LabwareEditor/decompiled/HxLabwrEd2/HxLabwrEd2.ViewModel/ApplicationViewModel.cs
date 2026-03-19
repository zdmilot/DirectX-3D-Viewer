using System;
using System.Drawing;
using System.Linq.Expressions;
using System.Windows;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.CustomControls.SplashScreens;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.ViewModel;

public class ApplicationViewModel : ViewModelBase
{
	private ViewModelBase displayedViewModel;

	private string titleBarText;

	private readonly string appTitle = "HAMILTON LABWARE EDITOR";

	private bool _suppressShadowing;

	public ViewModelBase DisplayedViewModel
	{
		get
		{
			return displayedViewModel;
		}
		set
		{
			((ObservableObject)this).Set<ViewModelBase>((Expression<Func<ViewModelBase>>)(() => DisplayedViewModel), ref displayedViewModel, value);
		}
	}

	public string TitleBarText
	{
		get
		{
			return titleBarText;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => TitleBarText), ref titleBarText, value);
		}
	}

	public bool SuppressShadowing
	{
		get
		{
			return _suppressShadowing;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => SuppressShadowing), ref _suppressShadowing, value);
		}
	}

	public ApplicationViewModel()
	{
		string venusVersion = HxRegHelper.VenusVersion;
		if (!string.IsNullOrWhiteSpace(venusVersion))
		{
			appTitle = appTitle + " (" + venusVersion + ")";
		}
		DisplayedViewModel = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<TitlePageViewModel>();
		SecurityAndConfigurationManager.CurrentViewModel = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<TitlePageViewModel>();
		TitleBarText = appTitle;
		Environment.CurrentDirectory = HxRegHelper.LabwarePath;
		Messenger.Default.Register<GenericMessage<ViewModelBase>>((object)this, (object)"Navigation", (Action<GenericMessage<ViewModelBase>>)delegate(GenericMessage<ViewModelBase> msg)
		{
			Navigation(msg.Content);
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"AppClose", (Action<NotificationMessage>)delegate
		{
			Application.Current.MainWindow?.Close();
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"DisableShadowing", (Action<NotificationMessage>)delegate
		{
			SuppressShadowing = true;
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"EnableShadowing", (Action<NotificationMessage>)delegate
		{
			SuppressShadowing = false;
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"ShadowApplication", (Action<NotificationMessage>)delegate
		{
			ShadowApplication();
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"ShadowLoadingApplication", (Action<NotificationMessage>)delegate
		{
			ShadowLoadingApplication();
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"UnshadowApplication", (Action<NotificationMessage>)delegate
		{
			UnshadowApplication();
		}, false);
		Messenger.Default.Register<GenericMessage<string>>((object)this, (object)"AppendToAppTitle", (Action<GenericMessage<string>>)delegate(GenericMessage<string> msg)
		{
			AppendToAppTitle(msg.Content);
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"ResetAppTitle", (Action<NotificationMessage>)delegate
		{
			ResetAppTitle();
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"DisplayNotification", (Action<NotificationMessage>)delegate(NotificationMessage msg)
		{
			DialogWindowHelper.ShowDialogWithProportionalDimensions("", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogSimpleWarningViewModel>(), msg.Notification, 0.45, 0.2);
		}, false);
		Messenger.Default.Register<GenericMessage<Tuple<string, string>>>((object)this, (object)"CatManagerYesNoDialog", (Action<GenericMessage<Tuple<string, string>>>)delegate(GenericMessage<Tuple<string, string>> msg)
		{
			DialogUnsavedChangesViewModel instance = SimpleIoc.Default.GetInstance<DialogUnsavedChangesViewModel>();
			instance.GenericText = msg.Content.Item2;
			bool? flag = DialogWindowHelper.ShowDialogWithProportionalDimensions(msg.Content.Item1, (ViewModelBase)(object)instance, UnsavedChangesDialogExitText.Generic, 0.4, 0.2);
			Messenger.Default.Send<GenericMessage<bool>>(new GenericMessage<bool>(flag.HasValue && flag.Value), (object)"CatManagerYesNoResponse");
		}, false);
	}

	~ApplicationViewModel()
	{
		try
		{
			Messenger.Default.Unregister((object)this);
		}
		finally
		{
			((object)this).Finalize();
		}
	}

	private void ShadowApplication()
	{
		if (WindowShadowHelper.ShadowWindowReference == null && WindowShadowHelper.MainWindowRendered && !SuppressShadowing)
		{
			Rectangle windowRectangle = Application.Current.MainWindow.GetWindowRectangle();
			BlankShadow obj = new BlankShadow
			{
				Owner = Application.Current.MainWindow,
				Width = windowRectangle.Width,
				Height = windowRectangle.Height,
				Left = windowRectangle.Left,
				Top = windowRectangle.Top
			};
			WindowShadowHelper.ShadowWindowReference = obj;
			obj.Show();
		}
	}

	private void ShadowLoadingApplication()
	{
		_ = Application.Current;
		if (WindowShadowHelper.ShadowWindowReference == null && WindowShadowHelper.MainWindowRendered && !SuppressShadowing)
		{
			Rectangle windowRectangle = Application.Current.MainWindow.GetWindowRectangle();
			LoadingShadow obj = new LoadingShadow
			{
				Owner = Application.Current.MainWindow,
				Width = windowRectangle.Width,
				Height = windowRectangle.Height,
				Left = windowRectangle.Left,
				Top = windowRectangle.Top
			};
			WindowShadowHelper.ShadowWindowReference = obj;
			obj.Show();
		}
	}

	private void UnshadowApplication()
	{
		if (WindowShadowHelper.ShadowWindowReference == null || !WindowShadowHelper.MainWindowRendered || SuppressShadowing || DialogWindowHelper.IsDialogDisplayed())
		{
			return;
		}
		WindowShadowHelper.ShadowWindowReference.Owner = null;
		WindowShadowHelper.ShadowWindowReference.Close();
		WindowShadowHelper.ShadowWindowReference = null;
		while (true)
		{
			Window mainWindow = Application.Current.MainWindow;
			if (mainWindow != null && !mainWindow.IsActive)
			{
				Application.Current.MainWindow.Activate();
				Application.Current.MainWindow.Focus();
				continue;
			}
			break;
		}
	}

	private void Navigation(ViewModelBase vm)
	{
		SecurityAndConfigurationManager.UpdateViewModelFlags(vm);
		DisplayedViewModel = vm;
	}

	private void AppendToAppTitle(string stringToAppend)
	{
		if (!string.IsNullOrEmpty(stringToAppend))
		{
			TitleBarText = appTitle + " - " + stringToAppend;
		}
		else
		{
			ResetAppTitle();
		}
	}

	private void ResetAppTitle()
	{
		TitleBarText = appTitle;
	}
}
