using System;

namespace HxLabwrEd2.DialogWindows;

public class WeakEventHandler<T, TE> : IWeakEventHandler<TE> where T : class where TE : EventArgs
{
	private delegate void OpenEventHandler(T @this, object sender, TE e);

	private readonly OpenEventHandler mOpenHandler;

	private readonly WeakReference mTargetRef;

	private UnregisterCallback<TE> mUnregister;

	public EventHandler<TE> Handler { get; }

	public WeakEventHandler(EventHandler<TE> eventHandler, UnregisterCallback<TE> unregister)
	{
		mTargetRef = new WeakReference(eventHandler.Target);
		mOpenHandler = (OpenEventHandler)Delegate.CreateDelegate(typeof(OpenEventHandler), null, eventHandler.Method);
		Handler = Invoke;
		mUnregister = unregister;
	}

	public void Invoke(object sender, TE e)
	{
		T val = (T)mTargetRef.Target;
		if (val != null)
		{
			mOpenHandler(val, sender, e);
		}
		else if (mUnregister != null)
		{
			mUnregister(Handler);
			mUnregister = null;
		}
	}

	public static implicit operator EventHandler<TE>(WeakEventHandler<T, TE> weh)
	{
		return weh.Handler;
	}
}
