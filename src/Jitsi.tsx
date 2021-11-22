import React, { useState, useEffect, useRef } from 'react'
import { Props, JitsiMeetAPIOptions } from './types'
import * as Default from './defaults'
import { importJitsiApi } from './utils'

const Jitsi: React.FC<Props> = (props: Props) => {
    const {
        containerStyle,
        frameStyle,
        loadingComponent,
        onAPILoad,
        onIframeLoad,
        domain,
        roomName,
        password,
        displayName,
        config,
        interfaceConfig,
        noSSL,
        jwt,
        devices,
        userInfo,
        videoConferenceJoinedListener,
        videoConferenceLeftListener
    } = { ...Default.Props, ...props }

    const [loading, setLoading] = useState(true)
    const ref = useRef<HTMLDivElement | null>(null)

    const Loader = loadingComponent || Default.Loader

    const _onIframeLoad = (): void => {
        if (onIframeLoad) { onIframeLoad() }
        setLoading(false)
    }

    const startConference = (JitsiMeetExternalAPI: any): void => {

        try {

            console.log('interfaceConfig', interfaceConfig);
            

            const options: JitsiMeetAPIOptions = {
                roomName,
                parentNode: ref.current,
                configOverwrite: config,
                interfaceConfigOverwrite: interfaceConfig,
                noSSL,
                jwt,
                onload: _onIframeLoad,
                devices,
                userInfo,
            }

            const api = new JitsiMeetExternalAPI(domain, options)

            if (!api) throw new Error('Failed to create JitsiMeetExternalAPI istance')

            if (onAPILoad) onAPILoad(api)

            api.addEventListener('videoConferenceJoined', (event: object) => {
                api.executeCommand('displayName', displayName)

                if (domain === Default.Props.domain && password)
                    api.executeCommand('password', password)

                if (videoConferenceJoinedListener)
                    videoConferenceJoinedListener(event);
            })

            api.addEventListener('videoConferenceLeft', (event: object) => {
                if (videoConferenceLeftListener)
                    videoConferenceLeftListener(event);
            })

            /** 
             * If we are on a self hosted Jitsi domain, we need to become moderators before setting a password
             * Issue: https://community.jitsi.org/t/lock-failed-on-jitsimeetexternalapi/32060
             */
            api.addEventListener('participantRoleChanged', (e: { id: string; role: string }) => {

                if (domain !== Default.Props.domain && password && e.role === 'moderator')
                    api.executeCommand('password', password)

            })

        } catch (error) { console.error('Failed to start the conference', error) }

    }

    useEffect(() => { 
        importJitsiApi(domain).then(jitsiApi => {
            startConference(jitsiApi);
        }).catch(err => {
            console.error('Jitsi Meet API library not loaded.', err)
        })
    }, [])

    return (
        <div id='react-jitsi-container' style={{ ...Default.ContainerStyle, ...containerStyle }}>
            {loading && <Loader />}
            <div id='react-jitsi-frame' style={{ ...Default.FrameStyle(loading), ...frameStyle }} ref={ref} />
        </div>
    )
}

export default Jitsi
