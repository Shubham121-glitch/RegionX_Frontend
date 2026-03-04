import React from 'react'
import './services.css'
import { FaArrowRight, FaGamepad, FaPenRuler, FaRobot } from 'react-icons/fa6'

const Services = () => {
    const renderServicesData = servicesData.map(service => {
        return (
            <div className='card design' key={service.id}>
                <span className='service-icon'>
                    {service.icon}
                </span>
                <h4 className='m-block-1'>
                    {service.title}
                </h4>
                <p className='m-block-1 hide-text'>
                    {service.description}
                </p>
            </div>
        )
    });
    return (
        <div>
            <div className="flex gap-2 mt-5 strech">
                {renderServicesData}
            </div>
        </div>
    )
}

export default Services


const servicesData = [
    {
        id: 1,
        title: 'Full Stack Development',
        description: 'Lorem ipsum, dolor sit amet consectetur adipisicing elit. Minima minus dolore eligendi.',
        icon: <FaPenRuler />
    },
    {
        id: 2,
        title: 'Data Analysis & AI Development',
        description: 'Lorem ipsum, dolor sit amet consectetur adipisicing elit. Minima minus dolore eligendi.',
        icon: <FaRobot />
    },
    {
        id: 3,
        title: 'Game Development',
        description: 'Lorem ipsum, dolor sit amet consectetur adipisicing elit. Minima minus dolore eligendi.',
        icon: <FaGamepad />
    },

]