using System;

namespace HxLabwrEd2.DialogWindows;

public static class EventHandlerUtils
{
	public static EventHandler<TE> MakeWeak<TE>(this EventHandler<TE> eventHandler, UnregisterCallback<TE> unregister) where TE : EventArgs
	{
		if (eventHandler == null)
		{
			throw new ArgumentNullException("eventHandler");
		}
		if (eventHandler.Method.IsStatic || eventHandler.Target == null)
		{
			throw new ArgumentException("Only instance methods are supported.", "eventHandler");
		}
		return ((IWeakEventHandler<TE>)typeof(WeakEventHandler<, >).MakeGenericType(eventHandler.Method.DeclaringType, typeof(TE)).GetConstructor(new Type[2]
		{
			typeof(EventHandler<TE>),
			typeof(UnregisterCallback<TE>)
		}).Invoke(new object[2] { eventHandler, unregister })).Handler;
	}
}
