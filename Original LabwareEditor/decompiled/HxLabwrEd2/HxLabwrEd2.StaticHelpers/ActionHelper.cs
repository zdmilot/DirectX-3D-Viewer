using System;
using GalaSoft.MvvmLight.Messaging;

namespace HxLabwrEd2.StaticHelpers;

public static class ActionHelper
{
	public static void PerformActionWithoutShadowing(Action action)
	{
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"DisableShadowing");
		action();
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"EnableShadowing");
	}
}
